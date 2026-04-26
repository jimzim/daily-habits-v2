// ESLint flat config (ESLint v9+)
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.expo/',
      'ios/',
      'android/',
      '.maestro/',
      'tests/',
      'expo-env.d.ts',
      'playwright.config.ts',
      'playwright-report/',
      'test-results/',
    ],
  },
];
