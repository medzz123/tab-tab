import { type SpawnOptionsWithoutStdio, spawn } from 'node:child_process';

export const runCommand = (
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio = {}
): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' });
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      if (code !== null) {
        reject(new Error(`Command "${command}" exited with code ${code}`));
        return;
      }
      reject(new Error(`Command "${command}" terminated with signal ${signal ?? 'unknown'}`));
    });
  });
