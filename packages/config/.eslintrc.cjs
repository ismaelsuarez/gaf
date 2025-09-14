const path = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import', 'security'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended'
  ],
  parserOptions: {
    project: [
      path.join(process.cwd(), 'apps/sync-service/tsconfig.json'),
      path.join(process.cwd(), 'apps/vendure/tsconfig.json'),
      path.join(process.cwd(), 'packages/config/tsconfig.base.json')
    ],
    tsconfigRootDir: process.cwd(),
    sourceType: 'module'
  },
  env: { node: true, es2022: true },
  settings: { 'import/resolver': { typescript: true } },
  rules: {
    'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
    '@typescript-eslint/no-floating-promises': 'error'
  },
  ignorePatterns: ['dist', 'node_modules']
};


