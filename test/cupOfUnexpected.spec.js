var unexpected = require('unexpected');

var cupOfUnexpected = require('../lib/cupOfUnexpected');

describe('cupOfUnexpected', () => {
  describe('assert', () => {
    it('should throw unsupported message', () => {
      unexpected(
        () => {
          // eslint-disable-next-line no-unused-expressions
          cupOfUnexpected.assert;
        },
        'to throw',
        'assert interface is not supported.'
      );
    });
  });

  describe('expect', () => {
    it('should return the implementation', () => {
      unexpected(cupOfUnexpected.expect, 'to be a function');
    });
  });

  describe('should()', () => {
    it('should throw unsupported message', () => {
      unexpected(
        () => {
          cupOfUnexpected.should();
        },
        'to throw',
        'should interface is no supported.'
      );
    });
  });

  describe('use()', () => {
    it('should be a function', () => {
      unexpected(cupOfUnexpected.use, 'to be a function');
    });
  });
});
