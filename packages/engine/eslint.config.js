import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'qa/**', 'critic/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'tools/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-globals': ['error', { name: 'Math.random', message: 'Use the seeded Rng for all simulation randomness.' }],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use the seeded Rng for all simulation randomness.' }, { object: 'Date', property: 'now', message: 'Simulation time is the world day, never wall-clock.' }],
    },
  },
  { files: ['tools/**/*.ts', 'test/**/*.ts'], rules: { 'no-restricted-properties': 'off' } },
);
