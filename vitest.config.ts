import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/config/setup.ts'],
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['dist', 'node_modules'],
  },
});
