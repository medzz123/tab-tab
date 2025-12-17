import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: [path.resolve('.env')] });

const checkDatabaseUrl = () => {
  const expectedDatabaseUrl = 'postgresql://postgres:fr24Password@localhost:5433/main';

  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl !== expectedDatabaseUrl) {
    console.error(
      `Error: DATABASE_URL does not match the expected value. Expected: "${expectedDatabaseUrl}", Got: "${databaseUrl}"`
    );
    process.exit(1);
  }
};

checkDatabaseUrl();
