import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
   resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Force Video.js to use ESM build to avoid UMD global 'this' issues
      'video.js': 'video.js/dist/video.es.js',
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          // Keep Video.js separate, but let dashjs and http-streaming be code-split
          videojs: ['video.js'],
          antd: ['antd'],
          lodash: ['lodash'],
          moment: ['moment'],
        },
      },
    },
  },
});
