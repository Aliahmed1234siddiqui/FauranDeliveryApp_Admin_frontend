import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    plugins: { 'simple-import-sort': simpleImportSort },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Imports in three blocks: packages, `@/` app modules, then relative files.
      'simple-import-sort/imports': [
        'error',
        { groups: [['^react', '^@?\\w'], ['^@/'], ['^\\.'], ['^.+\\.css$']] },
      ],
      'simple-import-sort/exports': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-const': 'error',
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    // Node-side config files.
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
]);
