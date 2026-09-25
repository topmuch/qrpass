// Create test data for finder voice guide testing:
// - Active pilgrim PH-P-TEST1 (identity trouveur /p/[code])
// - Active passport PP-TEST01 (passeport trouveur /scan-passeport/[qrCode])
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Active pilgrim
  const pilgrim = await db.pilgrim.upsert({
    where: { qrCode: 'PH-P-TEST1' },
    update: {
      isActive: true,
      fullName: 'Ahmed Testeur',
      firstName: 'Ahmed',
      lastName: 'Testeur',
      nationality: 'Tchadienne',
      groupLeaderPhone: '+23566352505',
      familyContact: '+23595729999',
      bloodType: 'O+',
      hotelMecca: 'Hôtel Zamzam Test',
      roomMecca: '412',
      duration: '60d',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    create: {
      qrCode: 'PH-P-TEST1',
      fullName: 'Ahmed Testeur',
      firstName: 'Ahmed',
      lastName: 'Testeur',
      nationality: 'Tchadienne',
      groupLeaderPhone: '+23566352505',
      familyContact: '+23595729999',
      bloodType: 'O+',
      hotelMecca: 'Hôtel Zamzam Test',
      roomMecca: '412',
      isActive: true,
      duration: '60d',
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Pilgrim:', pilgrim.qrCode, 'isActive=', pilgrim.isActive);

  // Active passport
  const passport = await db.passport.upsert({
    where: { qrCode: 'PP-TEST01' },
    update: {
      isActive: true,
      status: 'active',
      fullName: 'Fatima Aliou',
      firstName: 'Fatima',
      lastName: 'Aliou',
      nationality: 'Tchadienne',
      passportNumber: 'TCD1234567',
      phone: '+23566352505',
      whatsapp: '+23566352505',
      hotelName: 'ALSHAHBA ALFAIHA HOTEL',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      qrCode: 'PP-TEST01',
      fullName: 'Fatima Aliou',
      firstName: 'Fatima',
      lastName: 'Aliou',
      nationality: 'Tchadienne',
      passportNumber: 'TCD1234567',
      phone: '+23566352505',
      whatsapp: '+23566352505',
      hotelName: 'ALSHAHBA ALFAIHA HOTEL',
      isActive: true,
      status: 'active',
      duration: '1y',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Passport:', passport.qrCode, 'status=', passport.status);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
