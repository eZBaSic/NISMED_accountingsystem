/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      $lib: resolve('./src/lib'),
      $app: resolve('./node_modules/@sveltejs/kit/src/runtime/app')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    server: {
      deps: {
        inline: ['svelte']
      }
    }
  },
  define: {
    // Eliminate in-source test code in production
    'import.meta.vitest': 'undefined',
  }
});
