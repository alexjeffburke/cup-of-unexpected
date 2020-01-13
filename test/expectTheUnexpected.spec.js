var unexpected = require('unexpected');
var expect = require('../');

describe('index', () => {
  it('should be a function', () => {
    unexpected(expect, 'to be a function');
  });

  it('should throw if given multiple argument', () => {
    unexpected(
      () => {
        expect('foo', 'bar');
      },
      'to throw',
      'Expect takes at most one argument.'
    );
  });

  describe('.to.be.below(n)', function() {
    it('should pass', () => {
      expect(2).to.be.below(5);
    });

    it('should fail', () => {
      unexpected(
        () => {
          expect(5).to.be.below(5);
        },
        'to throw',
        'expected 5 to be below 5'
      );
    });
  });

  describe('.to.be.lessThan(n)', () => {
    it('should pass', () => {
      expect(2).to.be.lessThan(5);
    });

    it('should fail', () => {
      unexpected(
        () => {
          expect(5).to.be.lessThan(5);
        },
        'to throw',
        'expected 5 to be less than 5'
      );
    });
  });

  describe('.to.throw()', () => {
    it('should pass', () => {
      expect(() => {
        throw new SyntaxError();
      }).to.throw(e => {
        expect(e).to.be.a(SyntaxError);
      });
    });

    it('should fail', () => {
      unexpected(
        () => {
          expect(() => {
            throw new Error();
          }).to.throw(e => {
            expect(e).to.be.a(SyntaxError);
          });
        },
        'to throw',
        /[ ]{2}expected Error\(\) to be a SyntaxError$/
      );
    });
  });

  describe('addAssertion()', () => {
    it('should allow a simple custom assertion', () => {
      expect.addAssertion('<string> to foo', (unexpected, subject) => {
        unexpected(subject, 'to contain', 'foo');
      });

      unexpected(() => {
        expect('foobar').to.foo();
      }, 'not to throw');
    });

    it('should allow a nested custom assertion', () => {
      expect.addAssertion(
        '<string> to lower case foo',
        (unexpected, subject) => {
          unexpected(subject, 'to contain', 'foo');
        }
      );

      unexpected(() => {
        expect('foobar').to.lower.case.foo();
      }, 'not to throw');
    });

    it('should allow an argument consuming nested', () => {
      expect.addAssertion(
        '<array> to have something at index <number>',
        (unexpected, subject, value) => {
          unexpected(subject[value], 'to be defined');
        }
      );

      unexpected(() => {
        expect([1, 2]).to.have.something.at.index(1);
      }, 'not to throw');
    });
  });
});
