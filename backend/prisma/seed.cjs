const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'compras@fumiza.hn';
  const tenantName = 'FUMIZA Y MÁS';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!initialPassword || initialPassword.length < 12) {
    throw new Error(
      'Configura ADMIN_INITIAL_PASSWORD con al menos 12 caracteres.'
    );
  }

  let tenant = await prisma.tenant.findFirst({
    where: { name: tenantName },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: tenantName },
    });
    console.log('Empresa creada.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('La cuenta indicada ya existe. No se modificó.');
    return;
  }

  const passwordHash = await bcrypt.hash(initialPassword, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id,
      active: true,
    },
  });

  console.log('Cuenta ADMIN inicial creada correctamente.');
}

main()
  .catch((error) => {
    console.error('Error al preparar la cuenta inicial:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
