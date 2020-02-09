module.exports = {
  extends: ['standard', 'prettier', 'prettier/standard'],
  env: {
    amd: true,
    es6: true
  },
  overrides: [
    {
      files: ['test/*.spec.js'],
      env: {
        mocha: true
      }
    }
  ]
};
