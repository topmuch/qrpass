/**
 * QRPass — Create default admin user on first deployment
 * Called by Dockerfile CMD on container startup
 * Uses CommonJS (no TypeScript compilation needed at runtime)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 QRPass — Checking admin user...');

  const adminEmail = 'admin@qrpass.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const agencyEmail = 'agency@qrpass.com';
  const agencyPassword = process.env.AGENCY_PASSWORD || 'agency123';

  // Create or update superadmin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists:', adminEmail);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'SuperAdmin QRPass',
        password: hashedPassword,
        role: 'superadmin',
      },
    });
    console.log('✅ Admin user created:', adminEmail);
  }

  // Create or update demo agency user
  const existingAgency = await prisma.user.findUnique({
    where: { email: agencyEmail },
  });

  if (existingAgency) {
    console.log('✅ Agency user already exists:', agencyEmail);
  } else {
    // Create demo agency first
    const agency = await prisma.agency.upsert({
      where: { slug: 'demo-agency' },
      update: {},
      create: {
        name: 'Agence Démo QRPass',
        slug: 'demo-agency',
        email: 'contact@demo-qrpass.com',
        phone: '+33 1 23 45 67 89',
        address: 'Paris, France',
        active: true,
      },
    });

    const hashedPassword = await bcrypt.hash(agencyPassword, 10);
    await prisma.user.create({
      data: {
        email: agencyEmail,
        name: 'Chef Agence Démo',
        password: hashedPassword,
        role: 'agency',
        agencyId: agency.id,
      },
    });
    console.log('✅ Agency user created:', agencyEmail);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 QRPass Login Credentials:');
  console.log('  SuperAdmin: ' + adminEmail + ' / ' + adminPassword);
  console.log('  Agency:     ' + agencyEmail + ' / ' + agencyPassword);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e.message);
    // Don't exit with error — let the server start anyway
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
