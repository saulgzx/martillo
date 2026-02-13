require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.seedMarker.upsert({
    where: { key: 'initial_seed' },
    update: { value: new Date().toISOString() },
    create: { key: 'initial_seed', value: new Date().toISOString() },
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
