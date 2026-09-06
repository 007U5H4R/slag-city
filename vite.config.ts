import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@adapters': fileURLToPath(new URL('./src/adapters', import.meta.url)),
      '@shell': fileURLToPath(new URL('./src/shell', import.meta.url)),
    },
  },
  cacheDir: '/Volumes/E Drive/Dev/.caches/vite/slag-city',
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
  server: { port: 5173, strictPort: true },
});
