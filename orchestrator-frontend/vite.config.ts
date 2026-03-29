/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // ─── Code splitting per portal ─────────────────────────────────────────
    // Each portal's pages and layout are bundled into a dedicated chunk so
    // the main app shell stays lean and portals are fetched on-demand.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk: node_modules
          if (id.includes('node_modules')) {
            // React core (shared across all portals, tiny extra load)
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'vendor-react';
            }
            // react-router — shared shell dependency
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // lucide-react icons — large, shared across portals
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // date-fns — shared utility
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // All other third-party deps
            return 'vendor';
          }

          // ─── Portal page + layout chunks ────────────────────────────────
          // Pattern: src/pages/<portal>/* and src/layouts/<Portal>Layout.tsx
          if (id.includes('/src/pages/accounting') || id.includes('/src/layouts/AccountingLayout')) {
            return 'portal-accounting';
          }
          if (id.includes('/src/pages/admin') || id.includes('/src/layouts/AdminLayout')) {
            return 'portal-admin';
          }
          if (id.includes('/src/pages/superadmin') || id.includes('/src/layouts/SuperadminLayout')) {
            return 'portal-superadmin';
          }
          if (id.includes('/src/pages/sales') || id.includes('/src/layouts/SalesLayout')) {
            return 'portal-sales';
          }
          if (id.includes('/src/pages/factory') || id.includes('/src/layouts/FactoryLayout')) {
            return 'portal-factory';
          }
          if (id.includes('/src/pages/dealer') || id.includes('/src/layouts/DealerLayout')) {
            return 'portal-dealer';
          }

          // ─── API layer chunk ───────────────────────────────────────────
          // All lib/*Api.ts files share types but can be chunked together
          // as they're only used within portals (via dynamic imports).
          if (id.includes('/src/lib/') && id.includes('Api')) {
            return 'api-layer';
          }

          // Shared generated OpenAPI client — stays in the api-layer chunk
          if (id.includes('/src/lib/client')) {
            return 'api-layer';
          }
        },
      },
    },
  },
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        headers: {
          Origin: 'http://localhost:8081',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
    // Exclude Playwright E2E specs so Vitest does not try to run them in jsdom.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
      'tests/e2e/**',
    ],
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
  },
})
