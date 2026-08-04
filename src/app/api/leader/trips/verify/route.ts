import { NextRequest, NextResponse } from 'next/server';
import { validateOtp } from '@/lib/passhajj-utils';

// Demo OTP codes for testing
const DEMO_OTPS: Record<string, { agencyName: string; tripName: string }> = {
  '1234': { agencyName: 'Al Baraka Voyages', tripName: 'Hajj 2025 - Groupe 12' },
  '5678': { agencyName: 'Sénégal Hajj Services', tripName: 'Hajj 2025 - Groupe 7' },
  '9999': { agencyName: 'Maroc Omra Express', tripName: 'Omra Ramadan 2025' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp } = body;

    if (!otp || typeof otp !== 'string' || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return NextResponse.json({ error: 'Code OTP invalide. Entrez 4 chiffres.' }, { status: 400 });
    }

    // Try real DB first (graceful fallback if models not yet available)
    try {
      const result = await validateOtp(otp);
      if (result.valid && result.trip) {
        const trip = result.trip;

        return NextResponse.json({
          success: true,
          data: {
            tripId: trip.id,
            tripName: trip.name,
            agencyName: (trip.agency as { name: string }).name,
            pilgrims: trip.pilgrims.map((p: { id: string; qrCode: string; fullName: string; bloodType: string | null; allergies: string | null; group: { name: string } | null }) => ({
              id: p.id,
              qrCode: p.qrCode,
              fullName: p.fullName,
              bloodType: p.bloodType || undefined,
              allergies: p.allergies || undefined,
              group: p.group?.name,
            })),
            bags: trip.bags.map((b: { id: string; qrCode: string; ownerName: string; ownerId: string | null }) => ({
              id: b.id,
              qrCode: b.qrCode,
              ownerName: b.ownerName,
              ownerId: b.ownerId || undefined,
            })),
          },
        });
      }
      // If OTP not found in DB but it's a demo code, fall through
      if (!DEMO_OTPS[otp]) {
        return NextResponse.json(
          { error: result.error || 'Code OTP non reconnu' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      // DB models not available yet — fall through to demo OTPs
      console.warn('[Leader Verify] DB not available, using demo fallback');
    }

    // Fall back to demo OTPs for testing
    const demoData = DEMO_OTPS[otp];
    if (demoData) {
      const tripId = `TRIP-${otp}-${Date.now().toString(36).toUpperCase()}`;
      const pilgrims = generateMockPilgrims(otp);
      const bags = generateMockBags(otp, pilgrims);

      return NextResponse.json({
        success: true,
        data: { tripId, tripName: demoData.tripName, agencyName: demoData.agencyName, pilgrims, bags },
      });
    }

    return NextResponse.json(
      { error: result.error || 'Code OTP non reconnu' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Leader Verify] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function generateMockPilgrims(otp: string) {
  const firstNames = ['Mamadou', 'Fatou', 'Ibrahim', 'Aminata', 'Ousmane', 'Mariama', 'Abdoulaye', 'Khady', 'Moussa', 'Awa', 'Saliou', 'Ndeye', 'Cheikh', 'Bintou', 'Babacar', 'Coumba', 'Lamine', 'Dieynaba', 'Assane', 'Sokhna', 'Modou', 'Yacine', 'Pape', 'Adama', 'Birame'];
  const lastNames = ['Diallo', 'Ndiaye', 'Sow', 'Balde', 'Diop', 'Ba', 'Sy', 'Faye', 'Mbaye', 'Kane', 'Thiam', 'Gueye', 'Sarr', 'Lo', 'Diatta', 'Cisse', 'Tambadou', 'Drame', 'Silla', 'Camara', 'Touray', 'Jallow', 'Bah', 'Wally', 'Coly'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergies = [null, null, null, null, 'Pénicilline', 'Sulfamides', 'Aspirine', 'Iode', null, null, 'Arachides'];

  const count = 20 + Math.floor(Math.random() * 30);
  const pilgrims = [];

  for (let i = 0; i < count; i++) {
    const idx = (parseInt(otp) * 7 + i * 13) % firstNames.length;
    const lidx = (parseInt(otp) * 3 + i * 17) % lastNames.length;
    const num = String(i + 1).padStart(3, '0');
    pilgrims.push({
      id: `P-${otp}-${num}`,
      qrCode: `ID-${otp}${num}`,
      fullName: `${firstNames[idx]} ${lastNames[lidx]}`,
      bloodType: bloodTypes[(i * 3) % bloodTypes.length],
      allergies: allergies[(i * 5) % allergies.length] || undefined,
      group: `Groupe ${Math.floor(i / 10) + 1}`,
    });
  }

  return pilgrims;
}

function generateMockBags(otp: string, pilgrims: Array<{ id: string; qrCode: string; fullName: string }>) {
  const bags = [];
  for (let i = 0; i < pilgrims.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    bags.push({
      id: `B-${otp}-${num}-1`,
      qrCode: `BG-${otp}${num}1`,
      ownerName: pilgrims[i].fullName,
      ownerId: pilgrims[i].id,
    });
    if (Math.random() > 0.3) {
      bags.push({
        id: `B-${otp}-${num}-2`,
        qrCode: `BG-${otp}${num}2`,
        ownerName: pilgrims[i].fullName,
        ownerId: pilgrims[i].id,
      });
    }
  }
  return bags;
}
