import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs'],
  shims: false,
  dts: false,
  external: ['vscode'],
});
