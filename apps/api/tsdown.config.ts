import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/main.ts',
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  unbundle: true,
  noExternal: [/^@template\//],
  external: [/node_modules/],
  platform: 'node',
  target: 'node22',
  hash: false,
});
