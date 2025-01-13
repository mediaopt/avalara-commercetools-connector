import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['**/node_modules', '**/build/', '**/.nvmrc'],
  },
  {
    files: ['**/*.ts'],
  },
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'commonjs',
    },

    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'no-undef': 'error',
      'no-console': 'error',
      'no-const-assign': 'error',
    },
  },
];
