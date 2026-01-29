import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './features'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: [
      'my-test-repo-production.up.railway.app',
      'my-test-repo-production-f130.up.railway.app'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

