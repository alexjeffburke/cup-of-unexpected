const Assertion = require('./Assertion');
const createExpect = require('./createExpect');

const assert = new Proxy(
  {},
  {
    get: () => {
      throw new Error('assert interface is no supported.');
    },
    set: () => {
      return true;
    }
  }
);

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
  use(plugin) {
    const chai = {
      assert,
      Assertion
    };

    plugin(chai, Assertion.util);
  }
};
