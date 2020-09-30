module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: [
    'zk'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
  }
}
