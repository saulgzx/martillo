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
      role: Role.BIDDER,
      status: 'ACTIVE',
      passwordHash: agonzPasswordHash,
    },
    create: {
      email: 'agonz@martillo.com',
      passwordHash: agonzPasswordHash,
      role: Role.BIDDER,
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

  await prisma.user.upsert({
    where: { email: 'cliente.test@martillo.com' },
    update: {
      fullName: 'Cliente Test Martillo',
      role: Role.BIDDER,
      status: 'ACTIVE',
      passwordHash: qaClientPasswordHash,
    },
    create: {
      email: 'cliente.test@martillo.com',
      passwordHash: qaClientPasswordHash,
      role: Role.BIDDER,
      fullName: 'Cliente Test Martillo',
      rut: '10.000.000-2',
      phone: '+56910000002',
      status: 'ACTIVE',
    },
  });

  const now = new Date();
  const startAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endAt = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

  const existingAuction = await prisma.auction.findFirst({
    where: { title: 'Remate de Demostracion', createdById: admin.id },
    include: { lots: true },
  });

  if (!existingAuction) {
    await prisma.auction.create({
      data: {
        title: 'Remate de Demostracion',
        description: 'Remate base generado por seed',
        startAt,
        endAt,
        status: AuctionStatus.DRAFT,
        commissionPct: '10.00',
        terms: 'Terminos de ejemplo para entorno de desarrollo.',
        createdById: admin.id,
        lots: {
          create: [
            {
              title: 'Lote 1 - Reloj antiguo',
              description: 'Pieza de coleccion.',
              basePrice: '100000.00',
              minIncrement: '5000.00',
              currentPrice: '100000.00',
              status: LotStatus.DRAFT,
              orderIndex: 1,
              category: 'Coleccionismo',
            },
            {
              title: 'Lote 2 - Cuadro oleo',
              description: 'Obra enmarcada.',
              basePrice: '250000.00',
              minIncrement: '10000.00',
              currentPrice: '250000.00',
              status: LotStatus.DRAFT,
              orderIndex: 2,
              category: 'Arte',
            },
            {
              title: 'Lote 3 - Camara vintage',
              description: 'Camara fotografica clasica.',
              basePrice: '180000.00',
              minIncrement: '8000.00',
              currentPrice: '180000.00',
              status: LotStatus.DRAFT,
              orderIndex: 3,
              category: 'Tecnologia',
            },
          ],
        },
      },
    });
  }
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
