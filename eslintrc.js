module.exports = {
  root: true, // makes sure ESLint doesn’t go above project root
  env: {
    node: true, // enable Node.js global variables
    es2021: true, // enable modern ES features
  },
  parser: '@typescript-eslint/parser', // use TS parser
  parserOptions: {
    ecmaVersion: 'latest', // allow modern syntax
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended', // base ESLint rules
    'plugin:@typescript-eslint/recommended', // recommended TS rules
    'plugin:prettier/recommended', // enables prettier and shows errors as ESLint issues
  ],
  rules: {
    // ✅ Best practices
    'prettier/prettier': 'error', // always enforce Prettier formatting
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // ignore unused vars starting with _
    'no-console': 'warn', // warn if console.log left in
    'eqeqeq': ['error', 'always'], // enforce === instead of ==
  },
};