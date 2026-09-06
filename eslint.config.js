// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'assets/**', 'tools/**/out/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The boundary: src/core is pure TypeScript. No Phaser, no adapters, no shell, no DOM.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'phaser', message: 'src/core must not import Phaser (Solution-PRD §2 boundary rule).' }],
        patterns: [
          { group: ['@adapters/*', '@shell/*', '**/adapters/**', '**/shell/**'], message: 'src/core must not import adapters or shell.' },
        ],
      }],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'indexedDB', 'requestAnimationFrame', 'performance'],
    },
  },
);
