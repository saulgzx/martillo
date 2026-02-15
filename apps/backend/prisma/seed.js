require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient, Role, AuctionStatus, LotStatus } = require('@prisma/client');

const prisma = new PrismaClient();

function isProductionSeedMode() {
  const envName = (process.env.NODE_ENV || '').toLowerCase();
  const railwayEnv = (process.env.RAILWAY_ENVIRONMENT_NAME || '').toLowerCase();
  return envName === 'production' || railwayEnv === 'production';
}

function requiredProductionSeedVars() {
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim();
  const password = process.env.SEED_SUPERADMIN_PASSWORD?.trim();
  const fullName = process.env.SEED_SUPERADMIN_FULL_NAME?.trim() || 'Super Admin Martillo';
  const rut = process.env.SEED_SUPERADMIN_RUT?.trim() || '11.111.111-1';
  const phone = process.env.SEED_SUPERADMIN_PHONE?.trim() || '+56911111111';

  return { email, password, fullName, rut, phone };
}

async function main() {
  if (isProductionSeedMode()) {
    const prodSeed = requiredProductionSeedVars();
    if (!prodSeed.email || !prodSeed.password) {
      throw new Error(
        'Missing SEED_SUPERADMIN_EMAIL/SEED_SUPERADMIN_PASSWORD for production seed mode',
      );
    }

    const passwordHash = await bcrypt.hash(prodSeed.password, 12);
    await prisma.user.upsert({
      where: { email: prodSeed.email },
      update: {
        fullName: prodSeed.fullName,
        role: Role.SUPERADMIN,
        status: 'ACTIVE',
        passwordHash,
      },
      create: {
        email: prodSeed.email,
        passwordHash,
        role: Role.SUPERADMIN,
        fullName: prodSeed.fullName,
        rut: prodSeed.rut,
        phone: prodSeed.phone,
        status: 'ACTIVE',
      },
    });

    return;
  }

  const adminPasswordHash = await bcrypt.hash('Admin12345!', 12);
  const agonzPasswordHash = await bcrypt.hash('Agonz123', 12);
  const qaAdminPasswordHash = await bcrypt.hash('AdminMartillo123!', 12);
  const qaClientPasswordHash = await bcrypt.hash('ClienteMartillo123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@martillo.com' },
    update: {
      fullName: 'Super Admin Martillo',
      role: Role.SUPERADMIN,
      status: 'ACTIVE',
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@martillo.com',
      passwordHash: adminPasswordHash,
      role: Role.SUPERADMIN,
      fullName: 'Super Admin Martillo',
      rut: '11.111.111-1',
      phone: '+56911111111',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'agonz@martillo.com' },
    update: {
      fullName: 'Agonz',
      role: Role.USER,
      status: 'ACTIVE',
      passwordHash: agonzPasswordHash,
    },
    create: {
      email: 'agonz@martillo.com',
      passwordHash: agonzPasswordHash,
      role: Role.USER,
      fullName: 'Agonz',
      rut: '12.345.678-5',
      phone: '+56912345678',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin.test@martillo.com' },
    update: {
      fullName: 'Admin Test Martillo',
      role: Role.ADMIN,
      status: 'ACTIVE',
      passwordHash: qaAdminPasswordHash,
    },
    create: {
      email: 'admin.test@martillo.com',
      passwordHash: qaAdminPasswordHash,
      role: Role.ADMIN,
      fullName: 'Admin Test Martillo',
      rut: '10.000.000-1',
      phone: '+56910000001',
      status: 'ACTIVE',
    },
  });

  const qaClient = await prisma.user.upsert({
    where: { email: 'cliente.test@martillo.com' },
    update: {
      fullName: 'Cliente Test Martillo',
      role: Role.USER,
      status: 'ACTIVE',
      passwordHash: qaClientPasswordHash,
    },
    create: {
      email: 'cliente.test@martillo.com',
      passwordHash: qaClientPasswordHash,
      role: Role.USER,
      fullName: 'Cliente Test Martillo',
      rut: '10.000.000-2',
      phone: '+56910000002',
      status: 'ACTIVE',
    },
  });

  // Public demo auctions expected by the frontend routes: /auctions/remate-001, /auctions/remate-002
  // IDs are explicit strings to keep URLs stable in the UI skeleton (no slug system yet).
  const now = new Date();
  const publishedStartAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const publishedEndAt = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
  const liveStartAt = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const liveEndAt = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const auctionPublished = await prisma.auction.upsert({
    where: { id: 'remate-001' },
    update: {
      title: 'Remate de Arte y Coleccion',
      description: 'Remate demo para pruebas funcionales.',
      startAt: publishedStartAt,
      endAt: publishedEndAt,
      status: AuctionStatus.PUBLISHED,
      commissionPct: '10.00',
      terms: 'Participacion sujeta a aprobacion previa y terminos del remate.',
      createdById: admin.id,
    },
    create: {
      id: 'remate-001',
      title: 'Remate de Arte y Coleccion',
      description: 'Remate demo para pruebas funcionales.',
      startAt: publishedStartAt,
      endAt: publishedEndAt,
      status: AuctionStatus.PUBLISHED,
      commissionPct: '10.00',
      terms: 'Participacion sujeta a aprobacion previa y terminos del remate.',
      createdById: admin.id,
    },
  });

  const auctionLive = await prisma.auction.upsert({
    where: { id: 'remate-002' },
    update: {
      title: 'Remate en Vivo - Tecnologia Clasica',
      description: 'Remate demo en vivo para pruebas de pujas.',
      startAt: liveStartAt,
      endAt: liveEndAt,
      status: AuctionStatus.LIVE,
      commissionPct: '10.00',
      terms: 'Participacion sujeta a aprobacion previa y terminos del remate.',
      createdById: admin.id,
    },
    create: {
      id: 'remate-002',
      title: 'Remate en Vivo - Tecnologia Clasica',
      description: 'Remate demo en vivo para pruebas de pujas.',
      startAt: liveStartAt,
      endAt: liveEndAt,
      status: AuctionStatus.LIVE,
      commissionPct: '10.00',
      terms: 'Participacion sujeta a aprobacion previa y terminos del remate.',
      createdById: admin.id,
    },
  });

  await prisma.lot.deleteMany({ where: { auctionId: auctionPublished.id } });
  await prisma.lot.deleteMany({ where: { auctionId: auctionLive.id } });

  await prisma.lot.createMany({
    data: [
      {
        id: 'lot-remate-001-1',
        auctionId: auctionPublished.id,
        title: 'Oleografiado Siglo XIX',
        description: 'Pieza en marco restaurado.',
        basePrice: '250000.00',
        minIncrement: '10000.00',
        currentPrice: '250000.00',
        status: LotStatus.PUBLISHED,
        orderIndex: 1,
        category: 'Arte',
      },
      {
        id: 'lot-remate-001-2',
        auctionId: auctionPublished.id,
        title: 'Camara Vintage 1950',
        description: 'Equipo funcional con estuche.',
        basePrice: '180000.00',
        minIncrement: '8000.00',
        currentPrice: '180000.00',
        status: LotStatus.PUBLISHED,
        orderIndex: 2,
        category: 'Tecnologia',
      },
      {
        id: 'lot-remate-002-1',
        auctionId: auctionLive.id,
        title: 'Radio clasica',
        description: 'Radio antigua en buen estado.',
        basePrice: '120000.00',
        minIncrement: '5000.00',
        currentPrice: '120000.00',
        status: LotStatus.ACTIVE,
        orderIndex: 1,
        category: 'Tecnologia',
      },
    ],
  });

  // Create a draft auction for admin flows (optional) if it doesn't exist yet.
  await prisma.auction.upsert({
    where: { id: 'remate-draft' },
    update: {
      title: 'Remate de Demostracion',
      description: 'Remate base generado por seed',
      startAt: publishedStartAt,
      endAt: publishedEndAt,
      status: AuctionStatus.DRAFT,
      commissionPct: '10.00',
      terms: 'Terminos de ejemplo para entorno de desarrollo.',
      createdById: admin.id,
    },
    create: {
      id: 'remate-draft',
      title: 'Remate de Demostracion',
      description: 'Remate base generado por seed',
      startAt: publishedStartAt,
      endAt: publishedEndAt,
      status: AuctionStatus.DRAFT,
      commissionPct: '10.00',
      terms: 'Terminos de ejemplo para entorno de desarrollo.',
      createdById: admin.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Prisma seed completed.');
  })
  .catch(async (error) => {
    console.error('Prisma seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
