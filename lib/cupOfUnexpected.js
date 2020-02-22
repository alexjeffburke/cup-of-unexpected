const Assertion = require('./Assertion');
const createExpect = require('./createExpect');

module.exports = {
  Assertion,
  get assert() {
    throw new Error('assert interface is not supported.');
  },
  get expect() {
    return createExpect(Assertion._unexpected);
  },
  should() {
    throw new Error('should interface is no supported.');
  },
  use() {
    throw new Error('The use() of plugins is not supported.');
  }
};
