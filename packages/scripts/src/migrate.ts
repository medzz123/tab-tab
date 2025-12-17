import './checkDatabaseUrl';

import { execSync } from 'node:child_process';
import { confirm, input } from '@inquirer/prompts';

const main = async () => {
  try {
    const name = await input({
      message: 'What is the name of the migration?',
      validate: (value) => (value.trim() ? true : 'Migration name cannot be empty'),
    });

    const dryRun = await confirm({
      message: 'Do you want to perform a dry run?',
      default: false,
    });

    console.log('\nMigration Summary:');
    console.log(`  Name: ${name}`);
    console.log(`  Dry Run: ${dryRun ? 'Yes' : 'No'}`);

    execSync(
      `turbo run @template/db#db:migrate -- --name "${name}" ${dryRun ? '--create-only' : ''}`,
      {
        stdio: 'inherit',
      }
    );
  } catch (error) {
    console.error('Error:', error);
  }
};

main();
