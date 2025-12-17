import fs from 'node:fs/promises';
import path from 'node:path';
import dayjs from 'dayjs';
import { z } from 'zod/v4';
import { runCommand } from './runCommand';

const envSchema = z.object({
  NETLIFY_AUTH_TOKEN: z.string().min(1),
  SITE_ID: z.string().min(1),
  CONFIG_FILE_NAME: z.string().min(1),
  BUILD_SOURCE_GS_URL: z.string().min(1),
  GITHUB_WORKSPACE: z.string().optional(),
});

const main = async (): Promise<void> => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables', result.error.format());
    process.exit(1);
  }
  const {
    NETLIFY_AUTH_TOKEN: netlifyAuthToken,
    SITE_ID: siteId,
    CONFIG_FILE_NAME: configFileName,
    BUILD_SOURCE_GS_URL: buildSourceGsUrl,
    GITHUB_WORKSPACE: githubWorkspace,
  } = result.data;

  const workspace = githubWorkspace ?? process.cwd();
  const timestamp = dayjs().valueOf();

  const tempDir = path.join(workspace, 'apps', 'app', '.tmp', `$temp-build-${timestamp}`);
  const downloadedFilePath = path.join(tempDir, 'build.zip');
  const appDistPath = path.join(tempDir, 'dist');

  console.log(`Workspace: ${workspace}`);
  await fs.mkdir(tempDir, { recursive: true });

  console.log(`Fetching build from GCS URL: ${buildSourceGsUrl}`);
  await runCommand('gcloud', ['storage', 'cp', buildSourceGsUrl, downloadedFilePath]);

  console.log(`Unzipping ${downloadedFilePath} into ${appDistPath}`);
  await fs.mkdir(appDistPath, { recursive: true });
  await runCommand('unzip', ['-o', downloadedFilePath, '-d', appDistPath]);

  console.log(`Injecting config file: ${configFileName}`);
  const configFilePath = path.join(workspace, 'apps', 'app', 'src', 'config', configFileName);
  const configContents = await fs.readFile(configFilePath, 'utf8');

  const assetsDir = path.join(appDistPath, 'assets');
  const indexPath = path.join(appDistPath, 'index.html');

  await fs.mkdir(assetsDir, { recursive: true });
  await fs.writeFile(path.join(assetsDir, 'env.js'), configContents);

  const htmlContent = await fs.readFile(indexPath, 'utf8');
  const modifiedHtmlContent = htmlContent.replace(
    /(<head>)/,
    `$1\n\t\t<script type="text/javascript" src="/assets/env.js?v=${timestamp}"></script>`
  );

  await fs.writeFile(indexPath, modifiedHtmlContent);

  const tempPackageJson = { name: 'temp-deploy-package', version: '1.0.0' };
  await fs.writeFile(path.join(appDistPath, 'package.json'), JSON.stringify(tempPackageJson));

  await runCommand(
    'pnpm',
    ['netlify', 'deploy', '--dir=.', '--prod', '--no-build', '--site', siteId],
    {
      cwd: appDistPath,
      env: {
        ...process.env,
        NETLIFY_AUTH_TOKEN: netlifyAuthToken,
      },
    }
  );

  console.log(`Deployment to ${siteId} successful!`);
};

void main();
