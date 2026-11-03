const js = require('@eslint/js')
const globals = require('globals')
const { defineConfig } = require('eslint/config')

module.exports = defineConfig([
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  // test files also use Jest's describe, test and expect
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
])
