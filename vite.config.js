import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/inuta-map/',

  publicDir: 'public',

  build: {
    sourcemap: true
  }
});