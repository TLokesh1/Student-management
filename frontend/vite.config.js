import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiEndpoints = [
  '/auth',
  '/students',
  '/departments',
  '/faculty',
  '/courses',
  '/attendance',
  '/marks',
  '/assignments'
];

const proxyConfig = {};
apiEndpoints.forEach((endpoint) => {
  proxyConfig[endpoint] = {
    target: 'http://localhost:8080',
    changeOrigin: true,
    bypass: (req) => {
      // If the browser is requesting an HTML page, serve index.html for SPA client-side routing
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return '/index.html';
      }
    }
  };
});

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: proxyConfig
  }
});
