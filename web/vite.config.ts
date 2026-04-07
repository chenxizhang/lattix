import { defineConfig, type Plugin } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/** Vite plugin that stamps `__BUILD_HASH__` in `public/sw.js` at build time. */
function swBuildHashPlugin(): Plugin {
  return {
    name: 'sw-build-hash',
    apply: 'build',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist', 'sw.js');
      const content = readFileSync(swPath, 'utf-8');
      const hash = Date.now().toString(36);
      writeFileSync(swPath, content.replace('__BUILD_HASH__', hash), 'utf-8');
    },
  };
}

export default defineConfig({
  root: '.',
  base: '/',
  plugins: [swBuildHashPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
