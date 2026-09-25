// Create or reset a test pilgrim (inactive) for activation E2E testing
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const qrCode = 'PH-P-TEST1';
  const pilgrim = await db.pilgrim.upsert({
    where: { qrCode },
    update: {
      isActive: false,
      fullName: 'Pèlerin Test',
      firstName: null,
      lastName: null,
      nationality: '',
      expiresAt: null,
      photoUrl: null,
      bloodType: null,
    },
    create: {
      qrCode,
      fullName: 'Pèlerin Test',
      nationality: '',
      isActive: false,
    },
  });
  console.log('Test pilgrim ready:', pilgrim.qrCode, 'isActive=', pilgrim.isActive);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
