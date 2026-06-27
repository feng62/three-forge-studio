import { defineAppConfig } from '../../build/vite.config.base';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Use the shared defineAppConfig which includes the monorepoWatchPlugin
export default defineAppConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@forge/editor': path.resolve(__dirname, '../../packages/editor/src/index.ts'),
      '@forge/core': path.resolve(__dirname, '../../packages/core/src/index.ts')
    }
  },
  server: {
    port: 3000
  }
}, ['core', 'editor']); // Watch these packages
