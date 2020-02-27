const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const plugins = [commonjs(), nodeResolve()];

module.exports = [
  {
    input: 'build/lib/cupOfUnexpected.js',
    external: ['unexpected'],
    output: {
      file: 'cupOfUnexpected.umd.js',
      name: 'expect',
      exports: 'named',
      format: 'umd',
      sourcemap: true,
      strict: false,
      globals: {
        unexpected: 'weknowhow.expect'
      }
    },
    plugins
  }
];
