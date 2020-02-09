const Assertion = require('./Assertion');
const createExpect = require('./createExpect');

module.exports = {
  Assertion,
  get expect() {
    return createExpect(Assertion._unexpected);
  }
};
