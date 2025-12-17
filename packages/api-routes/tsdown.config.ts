import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/router.ts'],
  dts: { emitDtsOnly: true },
  hash: false,
});
