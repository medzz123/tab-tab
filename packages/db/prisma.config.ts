import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import type { PrismaConfig } from 'prisma';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

export default {
  schema: path.join('src', 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join('src', 'prisma', 'migrations'),
    seed: 'tsx src/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
} satisfies PrismaConfig;
