import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Demo OTP codes mapped to agency data
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
      return NextResponse.json(
        { error: 'Code OTP invalide. Entrez 4 chiffres.' },
        { status: 400 }
      );
    }

    // Check demo OTPs first
    const demoData = DEMO_OTPS[otp];
    
    if (demoData) {
      // Generate mock trip data for demo
      const tripId = `TRIP-${otp}-${Date.now().toString(36).toUpperCase()}`;
      const pilgrims = generateMockPilgrims(otp);
      const bags = generateMockBags(otp, pilgrims);
      
      return NextResponse.json({
        success: true,
        data: {
          tripId,
          tripName: demoData.tripName,
          agencyName: demoData.agencyName,
          pilgrims,
          bags,
        },
      });
    }

    // Try to find a real agency with this OTP (future: add otp field to Agency model)
    // For now, return error for non-demo codes
    return NextResponse.json(
      { error: 'Code OTP non reconnu. Vérifiez et réessayez.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Leader Verify] Error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur. Réessayez.' },
      { status: 500 }
    );
  }
}

function generateMockPilgrims(otp: string) {
  const firstNames = ['Mamadou', 'Fatou', 'Ibrahim', 'Aminata', 'Ousmane', 'Mariama', 'Abdoulaye', 'Khady', 'Moussa', 'Awa', 'Saliou', 'Ndeye', 'Cheikh', 'Bintou', 'Babacar', 'Coumba', 'Lamine', 'Dieynaba', 'Assane', 'Sokhna', 'Modou', 'Yacine', 'Pape', 'Adama', 'Birame'];
  const lastNames = ['Diallo', 'Ndiaye', 'Sow', 'Balde', 'Diop', 'Ba', 'Sy', 'Faye', 'Mbaye', 'Kane', 'Thiam', 'Gueye', 'Sarr', 'Lo', 'Diatta', 'Cisse', 'Tambadou', 'Drame', 'Silla', 'Camara', 'Touray', 'Jallow', 'Bah', 'Wally', 'Coly'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergies = [null, null, null, null, 'Pénicilline', 'Sulfamides', 'Aspirine', 'Iode', null, null, 'Arachides'];
  
  const count = 20 + Math.floor(Math.random() * 30); // 20-50 pilgrims
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
  // 1-2 bags per pilgrim
  for (let i = 0; i < pilgrims.length; i++) {
    const num = String(i + 1).padStart(3, '0');
    bags.push({
      id: `B-${otp}-${num}-1`,
      qrCode: `BG-${otp}${num}1`,
      ownerName: pilgrims[i].fullName,
      ownerId: pilgrims[i].id,
    });
    // 70% chance of second bag
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
