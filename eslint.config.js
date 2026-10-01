// Lint for correctness and for the structure ARCHITECTURE.md describes.
// Formatting belongs to Prettier, so no style rules here.
const js = require('@eslint/js');
const globals = require('globals');

const strict = {
  eqeqeq: ['error', 'always'],
  'no-var': 'error',
  'prefer-const': 'error',
  'object-shorthand': 'error',
  'prefer-template': 'error',
  'no-else-return': 'error',
  'no-shadow': 'error',
  'no-param-reassign': 'error',
  'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
  // Small modules: split a file before it grows past one screenful or two.
  'max-lines': [
    'error',
    { max: 200, skipBlankLines: true, skipComments: true },
  ],
  'max-depth': ['error', 3],
  'max-params': ['error', 3],
};

module.exports = [
  { ignores: ['node_modules/', 'public/build/'] },
  js.configs.recommended,
  {
    files: ['client/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.browser },
    rules: strict,
  },
  {
    files: ['bin/**/*.js', 'lib/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: strict,
  },
  {
    // Browser tests pass callbacks into the page, so they see both worlds.
    files: ['tests/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: { ...strict, 'max-lines': 'off' },
  },
];
