import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { localPublishPlugin } from '../../plugins/vite-plugin-local-publish/index.ts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ForgeEditor',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', 'three', 'three/webgpu', '@forge/core']
    }
  },
  plugins: [
    vue(),
    dts(),
    tailwindcss(),
    localPublishPlugin()
  ]
});
