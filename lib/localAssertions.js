module.exports = unexpected => {
  unexpected.addAssertion('<any> [not] to be extensible', (expect, obj) => {
    if (!(typeof obj === 'object' && obj) && expect.flags.not) return;
    expect(Object.isExtensible(obj), 'to equal', !expect.flags.not);
  });

  unexpected.addAssertion('<any> [not] to be frozen', (expect, obj) => {
    expect(Object.isFrozen(obj), 'to equal', !expect.flags.not);
  });

  unexpected.addAssertion('<any> [not] to be sealed', (expect, obj) => {
    expect(Object.isSealed(obj), 'to equal', !expect.flags.not);
  });

  unexpected.addAssertion('<any> [not] to be true', (expect, subject) => {
    if (typeof subject !== 'boolean' && expect.flags.not) return;
    expect(subject, 'to equal', true);
  });

  unexpected.addAssertion('<any> [not] to be false', (expect, subject) => {
    if (typeof subject !== 'boolean' && expect.flags.not) return;
    expect(subject, 'to equal', false);
  });

  unexpected.addAssertion('<any> [not] to be null', (expect, subject) => {
    if (subject !== null && expect.flags.not) return;
    expect(subject, 'to equal', null);
  });

  unexpected.addAssertion('<any> [not] to be undefined', (expect, subject) => {
    if (typeof subject !== 'undefined' && expect.flags.not) return;
    expect(subject, 'to equal', undefined);
  });

  unexpected.addAssertion('<any> [not] to be NaN', (expect, subject) => {
    if (expect.flags.not) {
      if (typeof subject !== 'number') return;
      if (typeof subject === 'number' && isNaN(subject)) return;
    } else {
      if (typeof subject !== 'number') return;
      if (typeof subject === 'number' && !isNaN(subject)) return;
    }

    expect.fail();
  });

  unexpected.addAssertion(
    '<any> [not] to have a [own] property <string> <any?>',
    (expect, subject, propName, ...rest) => {
      if (typeof subject === 'string') {
        subject = { length: subject.length };
      } else if (typeof subject === 'number') {
        subject = {};
      }

      var args = [propName];
      var kind = 'key';
      if (rest.length === 1) {
        kind = 'property';
        args.push(rest[0]);
        expect.errorMode = 'nested';
      }
      // use  "key" variant for undefined sentivity
      expect(subject, `[not] to have ${kind}`, ...args);
    }
  );

  unexpected.addAssertion(
    '<any> [not] to have own property descriptor <string> <object?>',
    (expect, subject, propName, ...rest) => {
      var descriptor = Object.getOwnPropertyDescriptor(subject, propName);

      if (rest.length > 0) {
        expect.errorMode = 'nested';
        expect(descriptor, 'to satisfy', rest[0]);
      } else {
        expect(descriptor, '[not] to be truthy');
      }

      return descriptor;
    }
  );

  unexpected.addAssertion(
    '<object> [not] to be a number',
    (expect, subject) => {
      var isBoxedNumber = subject instanceof Number;
      expect(isBoxedNumber, expect.flags.not ? 'to be false' : 'to be true');
    }
  );

  unexpected.addAssertion(
    '<any> [not] to be one of <any>',
    (expect, subject, value) => {
      expect(value.includes(subject), 'to be true');
    }
  );

  unexpected.addAssertion(
    '<any> [not] to contain <string>',
    (expect, subject, value) => {
      expect.errorMode = 'bubble';
      expect(subject, 'to be a string');
    }
  );

  unexpected.addAssertion(
    '<any> [not] to deeply equal <any>',
    (expect, subject, value) => {
      expect(subject, '[not] to equal', value);
    }
  );

  // TODO: mark as unsafe
  unexpected.addAssertion(
    '<object> [not] to have keys <object>',
    (expect, subject, value) => {
      expect.argsOutput[0] = output => {
        output.appendInspected(Object.keys(value));
      };
      expect(subject, '[not] to have keys', Object.keys(value));
    }
  );

  unexpected.addAssertion(
    '<array-like|string> [not] to have length above <number>',
    (expect, subject, value) => {
      expect.errorMode = 'nested';
      expect(subject.length, 'to be greater than', value);
    }
  );

  unexpected.addAssertion(
    '<array-like|string> [not] to have length below <number>',
    (expect, subject, value) => {
      expect.errorMode = 'nested';
      expect(subject.length, 'to be less than', value);
    }
  );

  unexpected.addAssertion(
    '<any> [not] to include <any>',
    (expect, subject, value) => {
      if (typeof subject === 'string' || expect.subjectType.is('array-like')) {
        expect(subject, '[not] to contain', value);
      } else if (typeof subject === 'object' && subject) {
        expect(subject, '[not] to satisfy', value);
      } else {
        expect.errorMode = 'bubble';
        expect.fail(
          `object tested must be an array, an object, or a string, but ${expect.subjectType.name} given`
        );
      }
    }
  );

  unexpected.addAssertion(
    '<array-like|string> [not] to have length within <number> <number>',
    (expect, subject, start, finish) => {
      expect.errorMode = 'nested';
      expect(subject.length, 'to be within', start, finish);
    }
  );

  unexpected.addAssertion(
    '<array-like> [not] to include [deep] members <array>',
    (expect, subject, members) => {
      if (expect.flags.deep) {
        expect(subject, '[not] to contain', ...members);
        return;
      }

      // do the checks with strict equality
      const items = expect.subjectType
        .getKeys(subject)
        .map(key => subject[key]);

      if (
        !expect.flags.not &&
        expect.flags.same &&
        items.length !== members.length
      ) {
        expect.errorMode = 'nested';
        expect.fail(
          'Unless .include. is used, subject and members must have identical length.'
        );
      }

      const missing = [];
      for (const member of members) {
        const isIncluded = items.includes(member);
        if (isIncluded === expect.flags.not) {
          missing.push(member);
        }
      }

      if (missing.length === 0) {
        return;
      } else if (expect.flags.not && missing.length >= items.length) {
        return;
      }

      expect.errorMode = 'nested';
      expect.fail(output => {
        output.jsComment('missing: ').appendInspected(missing);
      });
    }
  );

  unexpected.addAssertion(
    '<function> not to throw [a] <Error|function|regexp|string>',
    (expect, subject, value) => {
      let error;
      try {
        subject();
      } catch (e) {
        error = e;
      }
      // if there was no error, return cleanly
      if (!error) return;
      try {
        // check whether the thrown was what should NOT be thrown
        if (typeof value === 'function') {
          expect(error, 'to be a', value);
        } else {
          expect(error, 'to satisfy', value);
        }
      } catch (e) {
        // if did not, so we return cleanly
        return;
      }
      // the error we did not want to find occurred, throw
      expect.fail();
    }
  );
};
