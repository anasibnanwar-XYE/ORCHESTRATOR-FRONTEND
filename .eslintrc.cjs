module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/lib/client/**'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Playwright E2E test files run in Node.js and have no React components.
      files: ['tests/**/*.ts', 'tests/**/*.tsx', 'playwright.config.ts'],
      env: { node: true, browser: false },
      rules: {
        // E2E helpers and specs are not React component modules.
        'react-refresh/only-export-components': 'off',
        // react-hooks rules do not apply to Playwright test helpers.
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
}
