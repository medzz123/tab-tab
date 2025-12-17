import fs from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';

const findWorkspacePath = (workspaceName: string): string => {
  const appPath = path.join('apps', workspaceName);
  const libPath = path.join('packages', workspaceName);

  if (fs.existsSync(path.join(appPath, 'package.json'))) {
    return appPath;
  }
  if (fs.existsSync(path.join(libPath, 'package.json'))) {
    return libPath;
  }

  console.error(
    `Error: Could not find package.json for workspace "${workspaceName}" in apps/ or packages/.`
  );
  process.exit(1);
};

const formatEnvValue = (value: string): string => {
  if (
    (value.includes(' ') || value.includes('=')) &&
    value[0] !== '"' &&
    value[value.length - 1] !== '"'
  ) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
};

const syncEnvFile = (directoryPath: string) => {
  const exampleEnvPath = path.join(directoryPath, '.env.example');
  const envPath = path.join(directoryPath, '.env');

  if (!fs.existsSync(exampleEnvPath)) {
    console.error(`Error: Missing .env.example in ${directoryPath}`);
    process.exit(1);
  }

  const exampleContent = fs.readFileSync(exampleEnvPath, 'utf-8');
  const exampleLines = exampleContent.split('\n');
  const envKeyRegex = /^\s*([a-zA-Z0-9_]+)\s*=/;

  let currentConfig: dotenv.DotenvParseOutput = {};
  if (fs.existsSync(envPath)) {
    currentConfig = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
  } else {
    fs.writeFileSync(envPath, exampleContent);
    console.log(`Created ${envPath}`);
    return;
  }

  const exampleKeys = new Set<string>();
  for (const line of exampleLines) {
    const match = line.match(envKeyRegex);
    if (match?.[1]) {
      exampleKeys.add(match[1]);
    }
  }

  const newEnvLines: string[] = [];
  for (const line of exampleLines) {
    const match = line.match(envKeyRegex);
    if (match) {
      const key = match[1];
      if (key !== undefined && Object.hasOwn(currentConfig, key)) {
        if (currentConfig[key] !== undefined) {
          newEnvLines.push(`${key}=${formatEnvValue(currentConfig[key])}`);
        }
      } else {
        newEnvLines.push(line);
      }
    } else {
      newEnvLines.push(line);
    }
  }

  fs.writeFileSync(envPath, newEnvLines.join('\n'));
  console.log(`Synced ${envPath}`);
};

const mergeRootEnvToWorkspace = (rootDir: string, workspacePath: string) => {
  const rootEnvPath = path.join(rootDir, '.env');
  const workspaceEnvPath = path.join(workspacePath, '.env');

  const rootConfig = dotenv.parse(fs.readFileSync(rootEnvPath, 'utf-8'));
  const workspaceConfig = dotenv.parse(fs.readFileSync(workspaceEnvPath, 'utf-8'));

  const varsToAppend: string[] = [];

  for (const key in rootConfig) {
    if (!Object.hasOwn(workspaceConfig, key)) {
      if (rootConfig[key] !== undefined) {
        varsToAppend.push(`${key}=${formatEnvValue(rootConfig[key])}`);
      }
    }
  }

  if (varsToAppend.length > 0) {
    const appendString = `\n\n# Variables merged from root .env\n${varsToAppend.join('\n')}\n`;
    fs.appendFileSync(workspaceEnvPath, appendString);
    console.log(`Appended ${varsToAppend.length} root variables to ${workspaceEnvPath}`);
  } else {
    console.log(`Workspace .env is already in sync with root .env variables.`);
  }
};

const syncEnv = () => {
  const workspaceName = process.argv[2];

  if (!workspaceName) {
    console.error('Error: Missing workspace name. Usage: node script.js <workspace-name>');
    process.exit(1);
  }

  const rootDir = process.cwd();
  const workspacePath = findWorkspacePath(workspaceName);

  console.log(`Syncing root .env...`);
  syncEnvFile(rootDir);

  console.log(`Syncing workspace ${workspaceName} .env...`);
  syncEnvFile(workspacePath);

  console.log(`Merging root .env into workspace .env...`);
  mergeRootEnvToWorkspace(rootDir, workspacePath);

  console.log('Environment sync complete.');
};

syncEnv();
