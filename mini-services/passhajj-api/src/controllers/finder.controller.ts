// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Finder Controller
//  PUBLIC endpoint — QR code lookup for identity/baggage
//  No authentication required
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { prisma } from '../lib';
import { detectQRType } from '../utils/qrGenerator';

// ═══════════════════════════════════════════════════════════════
//  LOOKUP — Public QR code lookup
//  1. Detect type via detectQRType()
//  2. If "identity" → find Pilgrim, return safe data (no phone, passportNo)
//  3. If "baggage" → find Bag, return safe data (no ownerId)
//  4. Also check for active incidents related to this QR code
//  5. Unknown or not found → 404
// ═══════════════════════════════════════════════════════════════
export async function lookup(req: Request, res: Response): Promise<void> {
  try {
    // Accept qrCode from params or query
    const qrCode = (req.params.qrCode as string) || (req.query.qrCode as string);

    if (!qrCode) {
      res.status(400).json({ error: 'QR code requis.' });
      return;
    }

    // Detect QR type from prefix
    const qrType = detectQRType(qrCode);

    if (qrType === 'unknown') {
      res.status(404).json({
        error: 'QR code non reconnu.',
        hint: 'Les codes valides commencent par ID- (identité) ou BG- (bagage).',
      });
      return;
    }

    // Check for active (unresolved) incidents related to this QR code
    const activeIncidents = await prisma.incident.findMany({
      where: {
        relatedQrCode: qrCode,
        resolved: false,
      },
      select: {
        id: true,
        type: true,
        description: true,
        priority: true,
        zone: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    // ─── Identity lookup (Pilgrim) ───
    if (qrType === 'identity') {
      const pilgrim = await prisma.pilgrim.findUnique({
        where: { qrCode },
        include: {
          group: {
            select: { id: true, name: true, color: true },
          },
        },
      });

      if (!pilgrim) {
        res.status(404).json({
          error: 'Pèlerin non trouvé.',
          qrCode,
          type: 'identity',
        });
        return;
      }

      // Return safe data — exclude phone, passportNo, familyContact
      res.json({
        type: 'identity',
        qrCode: pilgrim.qrCode,
        fullName: pilgrim.fullName,
        firstName: pilgrim.firstName,
        lastName: pilgrim.lastName,
        nationality: pilgrim.nationality,
        gender: pilgrim.gender,
        bloodType: pilgrim.bloodType,
        allergies: pilgrim.allergies,
        diseases: pilgrim.diseases,
        medicalInfo: pilgrim.medicalInfo,
        hotelMecca: pilgrim.hotelMecca,
        roomMecca: pilgrim.roomMecca,
        hotelMedina: pilgrim.hotelMedina,
        roomMedina: pilgrim.roomMedina,
        photoUrl: pilgrim.photoUrl,
        isActive: pilgrim.isActive,
        group: pilgrim.group
          ? { name: pilgrim.group.name, color: pilgrim.group.color }
          : null,
        activeIncidents,
      });
      return;
    }

    // ─── Baggage lookup (Bag) ───
    if (qrType === 'baggage') {
      const bag = await prisma.bag.findUnique({
        where: { qrCode },
      });

      if (!bag) {
        res.status(404).json({
          error: 'Bagage non trouvé.',
          qrCode,
          type: 'baggage',
        });
        return;
      }

      // Return safe data — exclude ownerId
      res.json({
        type: 'baggage',
        qrCode: bag.qrCode,
        ownerName: bag.ownerName,
        baggageType: bag.baggageType,
        baggageIndex: bag.baggageIndex,
        color: bag.color,
        description: bag.description,
        airline: bag.airline,
        flightNumber: bag.flightNumber,
        destination: bag.destination,
        hotelName: bag.hotelName,
        roomNumber: bag.roomNumber,
        status: bag.status,
        photoUrl: bag.photoUrl,
        activeIncidents,
      });
      return;
    }

    // Should not reach here, but handle gracefully
    res.status(404).json({ error: 'Ressource non trouvée.' });
  } catch (error: any) {
    console.error('[finder.lookup]', error);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
}
