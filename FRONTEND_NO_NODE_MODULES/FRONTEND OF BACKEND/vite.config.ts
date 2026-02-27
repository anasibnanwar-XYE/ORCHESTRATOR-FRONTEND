import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Backend API is on port 8081
// Frontend dev server is on port 3002 (this file)
// The proxy forwards /api requests from 3002 to 8081
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig(({ mode }) => {
  // NOTE: Vite does NOT automatically populate process.env with values
  // from .env files inside vite.config.*. Use loadEnv instead.
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? env.VITE_API_BASE_URL ?? 'http://localhost:8081';

  return ({
  plugins: [react(), {
    name: 'handle-malformed-uri',
    configureServer(server) {
      // Add URL sanitization middleware BEFORE static file serving
      // This must run before viteServeStaticMiddleware
      server.middlewares.use((req, res, next) => {
        if (req.url) {
          try {
            // Validate URL by attempting to decode
            decodeURIComponent(req.url);
            // If successful, continue
            next();
          } catch {
            // URL is malformed - sanitize it
            const originalUrl = req.url;
            try {
              // Remove invalid characters and sequences
              req.url = originalUrl.replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
              .replace(/%[^0-9A-Fa-f]{1,2}/g, '') // Remove invalid % sequences
              .replace(/%$/, '') // Remove trailing %
              .replace(/^[^/]/, '/'); // Ensure starts with /

              // If URL becomes empty or invalid, redirect to root
              if (!req.url || req.url === '') {
                req.url = '/';
              }
              next();
            } catch {
              // Last resort: redirect to root
              req.url = '/';
              next();
            }
          }
        } else {
          next();
        }
      });
    }
  }],
  server: {
    port: 3002,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false
      }
    },
    // Handle paths with spaces properly
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  },
  // Resolve paths properly to handle spaces
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './admin')
    }
  },
  // Add custom error handling for malformed URIs
  optimizeDeps: {
    esbuildOptions: {
      // Handle paths with spaces
      preserveSymlinks: true
    }
  }
  });
});
