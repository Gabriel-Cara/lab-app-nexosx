import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.retrievalLog.deleteMany();
  await prisma.package.deleteMany();
  await prisma.visitLog.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.eventBooking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.residentInfo.deleteMany();
  await prisma.user.deleteMany();

  const password = 'Senha123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador Geral',
      email: 'admin@condoguardian.com',
      phone: '+55 11 90000-0000',
      passwordHash,
      role: Prisma.Role.ADMIN,
    },
  });

  const porter = await prisma.user.create({
    data: {
      name: 'Carlos Porteiro',
      email: 'porteiro@condoguardian.com',
      phone: '+55 11 98888-0000',
      passwordHash,
      role: Prisma.Role.PORTEIRO,
    },
  });

  const resident = await prisma.user.create({
    data: {
      name: 'Marina Moradora',
      email: 'moradora@condoguardian.com',
      phone: '+55 11 97777-0000',
      passwordHash,
      apartment: 'Bloco A - 101',
      role: Prisma.Role.MORADOR,
      residents: {
        create: {
          building: 'Bloco A',
          vehicle: 'ABC-1D23',
          emergencyContact: 'João Morador - +55 11 95555-0000',
        },
      },
    },
    include: {
      residents: true,
    },
  });

  const visitor = await prisma.visitor.create({
    data: {
      name: 'João Visitante',
      document: '123.456.789-00',
      phone: '+55 11 96666-0000',
      visitReason: 'Reunião com Marina',
      logs: {
        create: {
          host: { connect: { id: resident.id } },
          handledBy: { connect: { id: porter.id } },
          notes: 'Visitante autorizado e identificado na portaria.',
        },
      },
    },
    include: {
      logs: true,
    },
  });

  const packageDelivery = await prisma.package.create({
    data: {
      code: 'PKG-001',
      description: 'Encomenda da loja online',
      carrier: 'Correios',
      resident: { connect: { id: resident.id } },
      createdBy: { connect: { id: porter.id } },
      retrievalLogs: {
        create: {
          verifiedBy: { connect: { id: admin.id } },
          method: 'Retirado pessoalmente na portaria',
        },
      },
    },
    include: {
      retrievalLogs: true,
    },
  });

  const event = await prisma.event.create({
    data: {
      title: 'Churrasco da Primavera',
      description: 'Evento social para integração dos moradores.',
      location: 'Área gourmet',
      capacity: 30,
      startDate: new Date('2025-10-10T18:00:00.000Z'),
      endDate: new Date('2025-10-10T22:00:00.000Z'),
      createdBy: { connect: { id: admin.id } },
      bookings: {
        create: {
          resident: { connect: { id: resident.id } },
          notes: 'Confirmado com 2 convidados.',
        },
      },
    },
    include: {
      bookings: true,
    },
  });

  console.log('Seed finalizado com sucesso!');
  console.log('Credenciais de teste:');
  console.log(`E-mail: ${admin.email} | Senha: ${password}`);
  console.log(`E-mail: ${porter.email} | Senha: ${password}`);
  console.log(`E-mail: ${resident.email} | Senha: ${password}`);
  console.log('Dados gerados:', { admin, porter, resident, visitor, packageDelivery, event });
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
