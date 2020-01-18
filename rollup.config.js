const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const plugins = [commonjs(), nodeResolve()];

module.exports = [
    {
        input: 'build/lib/expectTheUnexpected.js',
        external: ['unexpected'],
        output: {
            file: 'index.js',
            name: 'expect',
            exports: 'default',
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
