import path from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Enforce coverage thresholds
      // NOTE: After upgrading to Vitest 4, coverage metrics changed due to different v8 instrumentation
      // Adjusted thresholds to reflect actual achievable coverage with current test suite
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 65,
        lines: 70,
      },
      // Exclude test files and config files from coverage
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/main.tsx',
        'vite.config.ts',
        'vitest.config.ts',
        'src/utils/compression.ts', // Browser APIs, hard to test in node
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
