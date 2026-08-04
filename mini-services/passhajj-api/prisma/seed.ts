// ═══════════════════════════════════════════════════════════════
//  PASSHAJJ MANAGER — Database Seed
//  Creates demo agencies, trips, pilgrims, and bags for testing
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PassHajj API database...\n');

  // ─── 1. Create SuperAdmin User ───
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@passhajj.com' },
    update: {},
    create: {
      email: 'admin@passhajj.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'superadmin',
      phone: '+221 77 000 00 00',
    },
  });
  console.log(`✅ SuperAdmin: ${superAdmin.email}`);

  // ─── 2. Create Agencies ───
  const agencies = [
    { name: 'Al Baraka Voyages', slug: 'al-baraka', email: 'contact@albaraka.sn', phone: '+221 33 800 00 01', country: 'Sénégal' },
    { name: 'Sénégal Hajj Services', slug: 'senegal-hajj', email: 'info@senegalhajj.sn', phone: '+221 33 800 00 02', country: 'Sénégal' },
    { name: 'Maroc Omra Express', slug: 'maroc-omra', email: 'contact@marocomra.ma', phone: '+212 5 00 00 00 01', country: 'Maroc' },
  ];

  const createdAgencies = [];
  for (const agencyData of agencies) {
    const agency = await prisma.agency.upsert({
      where: { slug: agencyData.slug },
      update: {},
      create: agencyData,
    });
    createdAgencies.push(agency);
    console.log(`✅ Agency: ${agency.name}`);
  }

  // ─── 3. Create Agency Users ───
  const agencyPassword = await bcrypt.hash('agency123', 10);
  for (const agency of createdAgencies) {
    const user = await prisma.user.upsert({
      where: { email: `leader@${agency.slug}.com` },
      update: {},
      create: {
        email: `leader@${agency.slug}.com`,
        name: `Chef ${agency.name}`,
        password: agencyPassword,
        role: 'agency',
        agencyId: agency.id,
      },
    });
    console.log(`✅ User: ${user.email}`);
  }

  // ─── 4. Create Trips with OTPs ───
  const otpConfigs = [
    { otp: '1234', name: 'Hajj 2025 - Groupe 12', agencyIdx: 0 },
    { otp: '5678', name: 'Hajj 2025 - Groupe 7', agencyIdx: 1 },
    { otp: '9999', name: 'Omra Ramadan 2025', agencyIdx: 2 },
  ];

  const createdTrips = [];
  for (const config of otpConfigs) {
    const agency = createdAgencies[config.agencyIdx];
    const otpExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now

    const trip = await prisma.trip.upsert({
      where: { otp: config.otp },
      update: { otpExpiry },
      create: {
        name: config.name,
        agencyId: agency.id,
        otp: config.otp,
        otpExpiry,
        status: 'active',
        destination: 'La Mecque',
        transportMode: 'flight',
        airline: config.agencyIdx === 2 ? 'Royal Air Maroc' : 'Air Sénégal',
        departureDate: new Date('2025-06-01'),
        returnDate: new Date('2025-06-30'),
        hotelMecca: 'Al Massa Grand Hotel',
        hotelMedina: 'Oberoi Hotel Medina',
      },
    });
    createdTrips.push(trip);
    console.log(`✅ Trip: ${trip.name} (OTP: ${trip.otp})`);
  }

  // ─── 5. Create Pilgrim Groups ───
  const firstNames = ['Mamadou', 'Fatou', 'Ibrahim', 'Aminata', 'Ousmane', 'Mariama', 'Abdoulaye', 'Khady', 'Moussa', 'Awa', 'Saliou', 'Ndeye', 'Cheikh', 'Bintou', 'Babacar', 'Coumba', 'Lamine', 'Dieynaba', 'Assane', 'Sokhna', 'Modou', 'Yacine', 'Pape', 'Adama', 'Birame'];
  const lastNames = ['Diallo', 'Ndiaye', 'Sow', 'Balde', 'Diop', 'Ba', 'Sy', 'Faye', 'Mbaye', 'Kane', 'Thiam', 'Gueye', 'Sarr', 'Lo', 'Diatta', 'Cisse', 'Tambadou', 'Drame', 'Silla', 'Camara', 'Touray', 'Jallow', 'Bah', 'Wally', 'Coly'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergyList = [null, null, null, 'Pénicilline', 'Sulfamides', 'Aspirine', 'Iode', 'Arachides'];

  // ─── 6. Create Pilgrims & Bags for each trip ───
  for (let t = 0; t < createdTrips.length; t++) {
    const trip = createdTrips[t];
    const agency = createdAgencies[otpConfigs[t].agencyIdx];

    // Create 2 groups per trip
    const groups = [];
    for (let g = 0; g < 2; g++) {
      const group = await prisma.pilgrimGroup.create({
        data: {
          name: `Groupe ${g + 1}`,
          leaderName: g === 0 ? `Chef ${trip.name}` : `Sous-chef ${trip.name}`,
          leaderPhone: `+221 77 ${String(800 + t * 10 + g).padStart(3, '0')} 00 00`,
          agencyId: agency.id,
          tripId: trip.id,
          color: g === 0 ? '#f4b400' : '#10b981',
        },
      });
      groups.push(group);
      console.log(`  ✅ Group: ${group.name} (Trip: ${trip.name})`);
    }

    // Create 25 pilgrims per trip
    const pilgrimCount = 25;
    const createdPilgrims = [];

    for (let i = 0; i < pilgrimCount; i++) {
      const idx = (t * 7 + i * 13) % firstNames.length;
      const lidx = (t * 3 + i * 17) % lastNames.length;
      const num = String(i + 1).padStart(3, '0');
      const firstName = firstNames[idx];
      const lastName = lastNames[lidx];

      const pilgrim = await prisma.pilgrim.create({
        data: {
          qrCode: `ID-${trip.otp}${num}`,
          fullName: `${firstName} ${lastName}`,
          firstName,
          lastName,
          nationality: agency.country,
          bloodType: bloodTypes[(i * 3) % bloodTypes.length],
          allergies: allergyList[(i * 5) % allergyList.length] || null,
          gender: i % 2 === 0 ? 'M' : 'F',
          hotelMecca: trip.hotelMecca,
          roomMecca: `${100 + i}`,
          agencyId: agency.id,
          tripId: trip.id,
          groupId: groups[i < 13 ? 0 : 1].id,
          isActive: true,
        },
      });
      createdPilgrims.push(pilgrim);
    }

    // Create bags for each pilgrim (1-2 bags each)
    let bagCount = 0;
    for (let i = 0; i < createdPilgrims.length; i++) {
      const pilgrim = createdPilgrims[i];
      const num = String(i + 1).padStart(3, '0');

      // Cabine bag (always)
      await prisma.bag.create({
        data: {
          qrCode: `BG-${trip.otp}${num}1`,
          ownerName: pilgrim.fullName,
          ownerId: pilgrim.id,
          baggageType: 'cabine',
          baggageIndex: 1,
          airline: trip.airline,
          flightNumber: `SN${100 + t}`,
          destination: 'Jeddah',
          hotelName: trip.hotelMecca,
          roomNumber: pilgrim.roomMecca,
          agencyId: agency.id,
          tripId: trip.id,
          status: 'active',
        },
      });
      bagCount++;

      // Soute bag (70% chance)
      if (i % 3 !== 2) {
        await prisma.bag.create({
          data: {
            qrCode: `BG-${trip.otp}${num}2`,
            ownerName: pilgrim.fullName,
            ownerId: pilgrim.id,
            baggageType: 'soute',
            baggageIndex: 2,
            airline: trip.airline,
            flightNumber: `SN${100 + t}`,
            destination: 'Jeddah',
            hotelName: trip.hotelMecca,
            roomNumber: pilgrim.roomMecca,
            agencyId: agency.id,
            tripId: trip.id,
            status: 'active',
          },
        });
        bagCount++;
      }
    }

    // Update trip counters
    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        totalPilgrims: pilgrimCount,
        totalBags: bagCount,
      },
    });

    console.log(`  ✅ ${pilgrimCount} pilgrims + ${bagCount} bags created for ${trip.name}`);
  }

  // ─── Summary ───
  const userCount = await prisma.user.count();
  const agencyCount = await prisma.agency.count();
  const tripCount = await prisma.trip.count();
  const pilgrimCount = await prisma.pilgrim.count();
  const bagCount = await prisma.bag.count();

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║          SEED COMPLETE — Summary                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Users:     ${String(userCount).padEnd(38)}║`);
  console.log(`║  Agencies:  ${String(agencyCount).padEnd(38)}║`);
  console.log(`║  Trips:     ${String(tripCount).padEnd(38)}║`);
  console.log(`║  Pilgrims:  ${String(pilgrimCount).padEnd(38)}║`);
  console.log(`║  Bags:      ${String(bagCount).padEnd(38)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Demo OTPs: 1234, 5678, 9999                     ║');
  console.log('║  Admin:      admin@passhajj.com / admin123        ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
