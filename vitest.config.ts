import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    setupFiles: ['src/shared/test/setup.ts'],
    isolate: true,
    alias: {
      '@/shared/graphql': path.resolve(__dirname, 'src/shared/test/stubs/graphql.ts'),
    },
  },
});
