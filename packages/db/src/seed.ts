import { env } from 'node:process';
import { prisma } from './client';

const isLocal = env.DATABASE_URL?.includes(
  'postgresql://postgres:fr24Password@localhost:5433/main'
);

async function main() {
  if (!isLocal) {
    throw new Error(
      'Error: env.DATABASE_URL does not match the expected value. Make sure you are using the local DB.'
    );
  }

  // biome-ignore lint/suspicious/noConsole: Its fine
  console.log('***** Seeding Database *****');

  await prisma.user.create({
    data: {
      name: 'Hello',
      email: 'hello@email.com',
    },
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
