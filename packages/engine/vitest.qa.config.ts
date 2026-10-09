import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['qa/**/*.qa.test.ts'], testTimeout: 900000, hookTimeout: 900000, pool: 'forks', fileParallelism: false },
});
