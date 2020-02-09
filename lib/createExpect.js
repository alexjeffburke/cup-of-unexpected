const ExpectFacade = require('./ExpectFacade');

module.exports = function createExpect(unexpected) {
  const parent = {};

  parent.unexpected = unexpected.clone();

  function expect(subject, ...rest) {
    if (rest.length > 0) {
      throw new Error('Expect takes at most one argument.');
    }

    return new ExpectFacade(subject, null, parent);
  }

  expect.addAssertion = (...args) => {
    // register through the expect facade
    ExpectFacade.addAssertion(...args);

    // refresh local close so assertions inherit the added assertions
    parent.unexpected = unexpected.clone();
  };

  expect.fail = (...args) => {
    let messageOrObject;
    if (args.length > 1) {
      messageOrObject = args[2] || '';
    } else {
      messageOrObject = args[0];
    }
    unexpected.fail(messageOrObject);
  };

  expect.outputFormat = unexpected.outputFormat;

  expect.version = '0.0.0';

  Object.defineProperty(expect, 'unexpected', {
    get() {
      return parent.unexpected;
    }
  });

  return expect;
};
