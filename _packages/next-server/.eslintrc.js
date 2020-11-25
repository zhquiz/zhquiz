module.exports = {
  env: {
    es2020: true,
    node: true
  },
  extends: ['standard'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'space-before-function-paren': 0,
    'array-callback-return': 0,
    'no-useless-constructor': 0
  }
}
