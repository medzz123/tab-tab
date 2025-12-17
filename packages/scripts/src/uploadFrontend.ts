import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod/v4';
import { runCommand } from './runCommand';

const envSchema = z.object({
  GCS_DESTINATION: z.string().min(1),
  GITHUB_WORKSPACE: z.string().optional(),
});

const main = async (): Promise<void> => {
  console.log('env', process.env);
  const result = envSchema.safeParse({
    GCS_DESTINATION: process.env.GCS_DESTINATION,
    GITHUB_WORKSPACE: process.env.GITHUB_WORKSPACE,
  });
  if (!result.success) {
    console.error('Invalid environment variables', result.error.format());
    process.exit(1);
  }

  const { GCS_DESTINATION: gcsDestination, GITHUB_WORKSPACE: githubWorkspace } = result.data;

  const workspace = githubWorkspace ?? process.cwd();
  const appDistPath = path.join(workspace, 'apps', 'app', 'dist');

  console.log(`Workspace path: ${workspace}, ${appDistPath}`);

  try {
    await fs.access(appDistPath);
  } catch {
    throw new Error(`Build output not found: ${appDistPath}`);
  }

  const zipFilePath = path.join(os.tmpdir(), 'app.zip');

  console.log(`Creating zip file at: ${zipFilePath}`);
  await runCommand('bash', ['-c', `cd "${appDistPath}" && zip -r "${zipFilePath}" .`]);

  console.log(`Uploading to GCS: ${gcsDestination}`);
  await runCommand('gcloud', ['storage', 'cp', zipFilePath, gcsDestination]);

  console.log('Upload complete.');
};

void main();
