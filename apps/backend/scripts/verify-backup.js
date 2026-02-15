/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('[verify-backup] starting DB write/read/delete probe');
  console.log(
    '[verify-backup] manual check: ensure Railway Postgres backups are enabled in service settings',
  );

  const email = `backup-check+${Date.now()}@martillo.local`;
  const phone = `+5699${Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0')}`;

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash: 'backup-check',
      role: 'USER',
      fullName: 'Backup Check',
      rut: '00.000.000-0',
      phone,
      status: 'INACTIVE',
    },
    select: { id: true, email: true },
  });

  const found = await prisma.user.findUnique({
    where: { id: created.id },
    select: { id: true, email: true },
  });

  if (!found) {
    throw new Error('read-after-write failed');
  }

  await prisma.user.delete({ where: { id: created.id } });
  console.log('[verify-backup] probe completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('[verify-backup] failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
