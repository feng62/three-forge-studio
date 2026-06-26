import { defineAppConfig } from '../../build/vite.config.base';
import vue from '@vitejs/plugin-vue';

// Use the shared defineAppConfig which includes the monorepoWatchPlugin
export default defineAppConfig({
  plugins: [vue()],
  server: {
    port: 3000
  }
}, ['core', 'editor']); // Watch these packages
