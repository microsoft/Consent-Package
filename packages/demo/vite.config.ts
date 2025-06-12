// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { githubPagesSpa } from '@sctg/vite-plugin-github-pages-spa';

const baseUrl = '/';

export default defineConfig({
  base: baseUrl,
  plugins: [react(), githubPagesSpa()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env.BASE_URL': JSON.stringify(baseUrl),
  },
});
