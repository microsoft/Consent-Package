import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'shared/**/*.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        '**/index.ts',
        'src/shared/dataAdapter.ts',
      ],
    },
    clearMocks: true,
    restoreMocks: true,
  },
});
