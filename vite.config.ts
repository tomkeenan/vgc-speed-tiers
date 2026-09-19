import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Proxy the API to a locally-running `wrangler dev` so the SPA and Worker share an origin in dev.
  // Port is pinned so the origin stays http://localhost:5173 (must match the Google OAuth origin).
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the rarely-changing framework libs into their own long-cache vendor chunks so app
        // edits don't invalidate them on repeat visits. MUI's shared runtime (system/utils/base +
        // emotion) is grouped here; individual @mui/material components stay splittable, so the
        // lazily-imported SettingsDialog's heavy ones (Autocomplete, Dialog) load on demand.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }
          if (
            id.includes('/@emotion/') ||
            id.includes('/@mui/system/') ||
            id.includes('/@mui/utils/') ||
            id.includes('/@mui/base/') ||
            id.includes('/@mui/private-theming/') ||
            id.includes('/@mui/styled-engine/')
          ) {
            return 'mui-vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
