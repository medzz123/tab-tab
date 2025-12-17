import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  minify: true,
  sourcemap: false,
  platform: 'node',
  target: 'node22',
  noExternal: [/^@template\//],
  external: [/node_modules/],
  env: { IS_SERVER_BUILD: 'true' },
});
