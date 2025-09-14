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
      path.join(process.cwd(), 'packages/config/tsconfig.base.json'),
      path.join(process.cwd(), 'packages/utils/tsconfig.json')
    ],
    tsconfigRootDir: process.cwd(),
    sourceType: 'module'
  },
  env: { node: true, es2022: true },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          path.join(process.cwd(), 'apps/sync-service/tsconfig.json'),
          path.join(process.cwd(), 'apps/vendure/tsconfig.json'),
          path.join(process.cwd(), 'packages/utils/tsconfig.json')
        ]
      },
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
      }
    }
  },
  rules: {
    'import/order': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/no-unresolved': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/export': 'off',
    'import/no-duplicates': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
  },
  ignorePatterns: ['dist', 'node_modules', '**/__tests__/**', 'scripts/**']
  ,
  overrides: [
    {
      files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
      rules: {
        'import/no-unresolved': 'off'
      }
    }
  ]
};


