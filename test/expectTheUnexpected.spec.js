var unexpected = require('unexpected');

var expect = require('../');

describe('index', () => {
  unexpected = unexpected.clone();

  unexpected.addAssertion(
    '<function> to throw textual message <regexp|string>',
    (expect, subject, value) => {
      expect(
        subject,
        'to throw',
        expect.it(error => {
          expect.errorMode = 'bubble';
          expect(error.getErrorMessage('text').toString(), 'to satisfy', value);
        })
      );
    }
  );

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
        'to throw textual message',
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
        'to throw textual message',
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
        'to throw textual message',
        'expected Error() to be a SyntaxError'
      );
    });
  });

  describe('.to.have.property(prop, val)', () => {
    it('should throw with an informative message with ".not"', () => {
      unexpected(
        () => {
          expect(undefined).not.to.have.property('foo', true);
        },
        'to throw',
        'The "not" flag with a value is unsafe in property().'
      );
    });
  });

  describe('.to.have.ownProperty(prop, val)', () => {
    it('should throw with an informative message with ".not"', () => {
      unexpected(
        () => {
          expect(undefined).not.to.have.property('foo', true);
        },
        'to throw',
        'The "not" flag with a value is unsafe in property().'
      );
    });
  });

  describe('.to.have.deep.property()', () => {
    it('should throw with an informative message', () => {
      unexpected(
        () => {
          expect(undefined).to.have.deep.property();
        },
        'to throw',
        'The "deep" flag is not supported with property().'
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

    describe('when called with an empty assertion', () => {
      it('should throw with an informative message', () => {
        unexpected(
          () => {
            expect.addAssertion(
              '<array><number>',
              (unexpected, subject, value) => {
                unexpected(subject[value], 'to be defined');
              }
            );
          },
          'to throw',
          'cannot define empty assertion'
        );
      });
    });

    describe('when called with an existing assertion', () => {
      it('should throw with an informative message', () => {
        unexpected(
          () => {
            expect.addAssertion(
              '<string> to contain',
              (unexpected, subject, value) => {
                unexpected(subject[value], 'to be defined');
              }
            );
          },
          'to throw',
          'cannot redefine existing assertion "contain()"'
        );
      });
    });

    describe('when called with missing flags', () => {
      it('should throw with an informative message', () => {
        expect.addAssertion(
          '<array> to have something at position <number>',
          (unexpected, subject, value) => {
            unexpected(subject[value], 'to be defined');
          }
        );

        unexpected(
          () => {
            expect([1, 2]).to.have.something.position(1);
          },
          'to throw',
          'incomplete flags for custom assertion'
        );
      });
    });
  });
});
