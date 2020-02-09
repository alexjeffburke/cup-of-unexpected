const AssertionError = require('assertion-error');
const StringKeysMap = require('./StringKeysMap');

const FLAGS = [
  'all',
  'an',
  'be',
  'contain',
  'deep',
  'have',
  'include',
  'length',
  'not',
  'only',
  'same',
  'to',
  'which',
  'with'
];
const TERMINATORS = [
  'extensible',
  'frozen',
  'sealed',
  'ok',
  'true',
  'false',
  'null',
  'undefined',
  'empty',
  'NaN'
];

function expectTheUnexpected(unexpected) {
  unexpected = unexpected.clone();

  unexpected.use(require('./localAssertions'));

  function expandFlags(pattern, flags) {
    return pattern
      .replace(/\[(!?)([^\]]+)\] ?/g, function(match, negate, flag) {
        return Boolean(flags[flag]) !== Boolean(negate) ? flag + ' ' : '';
      })
      .trim();
  }

  function makeError(err, msg) {
    err = err || {};

    var assertMessage;
    if (msg) {
      assertMessage = `${msg}: ${err.message}`;
    } else {
      assertMessage = err.message;
    }

    var assertionError = new AssertionError(assertMessage);
    assertionError.stack =
      err.stack && err.stack.replace(assertionError.message, err.message);

    // quack a little more like an Unexpected error
    assertionError.originalError = err;
    assertionError.getErrorMessage = format => {
      var pen = assertionError.originalError.getErrorMessage(format);
      if (msg) {
        pen = pen
          .clone()
          .text(`${msg}: `)
          .append(pen);
      }
      return pen;
    };

    return assertionError;
  }

  function stripTypes(pattern) {
    return pattern
      .replace(/(<[a-zA-z-]+[+?]?(?:[|][a-zA-z-]+)*>[ ]?)/g, '')
      .trim();
  }

  const flags = {};
  for (const flag of FLAGS) {
    flags[flag] = true;
  }
  const terminators = {};
  for (const prop of TERMINATORS) {
    terminators[prop] = true;
  }

  function assertionNamesFrom(obj) {
    return Object.keys(obj).filter(
      prop =>
        !prop.startsWith('_') &&
        typeof ExpectFacade.prototype[prop] === 'function'
    );
  }

  function defineSteps(obj, scope, extraFlags) {
    const flagNames = Object.keys(flags);
    const flagSet = Array.isArray(extraFlags)
      ? new Set([...flagNames, ...extraFlags])
      : new Set(flagNames);

    // do not offer any keys that have already occurred in the chain
    for (const key of Object.keys(scope.flags)) {
      flagSet.delete(key);
    }

    for (const prop of Array.from(flagSet)) {
      defineOneStep(obj, scope, prop);
    }
  }

  function defineStepsIfMissing(obj, scope, flags) {
    for (const prop of flags) {
      if (Object.getOwnPropertyDescriptor(obj, prop)) {
        continue;
      }

      defineOneStep(obj, scope, prop);
    }
  }

  function defineOneStep(obj, scope, prop) {
    Object.defineProperty(obj, prop, {
      get: function() {
        scope.flags[prop] = true;

        if (terminators[prop]) {
          ExpectFacade.prototype[prop].call(scope);
          return;
        }

        if (typeof ExpectFacade.prototype[prop] === 'function') {
          var fn = function(...args) {
            const result = ExpectFacade.prototype[prop].apply(scope, args);

            let nextSubject;
            if (result && result._capture) {
              nextSubject = result.nextSubject;
            } else {
              nextSubject = scope.subject;
            }

            return new ExpectFacade(nextSubject, ['and']);
          };

          const extraFlags = assertionNamesFrom(ExpectFacade.prototype);

          defineSteps(fn, scope, extraFlags);

          return fn;
        }

        return obj;
      }
    });
  }

  function ExpectFacade(subject, extraFlags) {
    this.flags = {};
    this.subject = subject;
    this.chainSubject = null;

    // define top level properties
    defineSteps(this, this, extraFlags);

    // define assertion getters to ensure results are always wrapped
    const assertionFlags = assertionNamesFrom(ExpectFacade.prototype);
    defineStepsIfMissing(this, this, assertionFlags);
  }

  ExpectFacade.prototype._unexpectedAssert = function(
    assertion,
    allArgs,
    numArgs = 1
  ) {
    var args = allArgs.slice(0, numArgs);
    if (args.length < numArgs) {
      // not enough args for assertion
    } else if (allArgs.length > numArgs + 1) {
      // too many args
    }
    var msg;
    if (allArgs[numArgs]) {
      msg = allArgs[numArgs];
    }

    try {
      return unexpected(
        this.subject,
        expandFlags(assertion, this.flags),
        ...args
      );
    } catch (e) {
      throw makeError(e, msg);
    }
  };

  // unsupported
  ExpectFacade.prototype.change = function() {
    throw new Error('The change() assertion is not supported.');
  };

  ExpectFacade.prototype.decrease = function() {
    throw new Error('The decrease() assertion is not supported.');
  };

  ExpectFacade.prototype.increase = function() {
    throw new Error('The increase() assertion is not supported.');
  };

  ExpectFacade.prototype.respondTo = function() {
    throw new Error('The respondTo() assertion is not supported.');
  };

  // assertions
  ExpectFacade.prototype.a = function(...args) {
    if (args[0] === 'number') {
      return this._unexpectedAssert('[not] to be a number', args.slice(1), 0);
    }

    return this._unexpectedAssert('[not] to be a', args, 1);
  };
  ExpectFacade.prototype.an = ExpectFacade.prototype.a;
  ExpectFacade.prototype.instanceof = ExpectFacade.prototype.a;

  ExpectFacade.prototype.keys = function(...args) {
    if (this.flags.any) {
      unexpected.fail('The "any" flag is not supported with keys().');
    }

    if (args.length === 0) {
      unexpected.fail('keys required');
    } else if (args.length > 1) {
      for (const arg of args) {
        if (typeof arg !== 'string') {
          unexpected.fail(
            [
              'keys must be given single argument of Array|Object|String,',
              'or multiple String arguments'
            ].join(' ')
          );
        }
      }
      args = [args];
    } else if (Array.isArray(args[0]) && args[0].length === 0) {
      unexpected.fail('keys required');
    }

    return this._unexpectedAssert('[not] to [only] have keys', args, 1);
  };
  ExpectFacade.prototype.key = ExpectFacade.prototype.keys;

  function handleProperty(...args) {
    if (this.flags.deep) {
      throw new Error('The "deep" flag is not supported with property().');
    }

    let numArgs;
    if (args.length === 1) {
      numArgs = 1;
    } else if (this.flags.not) {
      throw new Error('The "not" flag with a value is unsafe in property().');
    } else {
      numArgs = 2;
    }

    this._unexpectedAssert('[not] to have a property', args, numArgs);
    return { _capture: true, nextSubject: this.subject[args[0]] };
  }

  ExpectFacade.prototype.members = function(...args) {
    this._unexpectedAssert('[not] to include [deep] members', args, 1);
  };

  ExpectFacade.prototype.property = function(...args) {
    this.flags.a = true;
    return handleProperty.apply(this, args);
  };

  ExpectFacade.prototype.ownProperty = function(...args) {
    this.flags.own = true;
    return handleProperty.apply(this, args);
  };

  ExpectFacade.prototype.haveOwnProperty = function(...args) {
    this.flags.own = true;
    return handleProperty.apply(this, args);
  };

  function handleOwnPropertyDescriptor(...args) {
    if (args.length === 1) {
      return this._unexpectedAssert(
        '[not] to have own property descriptor',
        [args[0]],
        1
      );
    }

    if (args.length === 2 && typeof args[1] === 'string') {
      return this._unexpectedAssert(
        '[not] to have own property descriptor',
        args,
        1
      );
    }

    return this._unexpectedAssert(
      '[not] to have own property descriptor',
      args,
      2
    );
  }

  ExpectFacade.prototype.ownPropertyDescriptor = function(...args) {
    return handleOwnPropertyDescriptor.apply(this, args);
  };

  ExpectFacade.prototype.haveOwnPropertyDescriptor = function(...args) {
    return handleOwnPropertyDescriptor.apply(this, args);
  };

  ExpectFacade.prototype.satisfy = function(value, msg) {
    if (!value(this.subject)) {
      try {
        expect.fail(output => {
          output
            .text('expected ', 'error')
            .appendInspected(this.subject)
            .text(' to satisfy ')
            .appendInspected(value);
        });
      } catch (e) {
        throw makeError(e, msg);
      }
    }
  };

  ExpectFacade.prototype.throw = function(...args) {
    let assertion;
    if (typeof args[0] === 'function') {
      assertion = 'to throw a';
    } else {
      assertion = 'to throw';
    }

    let secondArgs = null;
    if (args.length > 1) {
      // remove the second check value and store a new args array
      secondArgs = args.splice(1, 1);
      // if there was a message passed, use it for the second check
      if (args.length > 1) {
        secondArgs.push(args[1]);
      }
    }

    const result = this._unexpectedAssert(`[not] ${assertion}`, args, 1);
    if (secondArgs) {
      this._unexpectedAssert('[not] to throw', secondArgs, 1);
    }
    return { _capture: true, nextSubject: result._settledValue };
  };

  ExpectFacade.prototype.withArgs = function(...args) {
    var result = new ExpectFacade(this.subject);
    var subject = this.subject;
    result.flags = this.flags;
    result.subject = function() {
      return subject.apply(null, args);
    };
    return result;
  };

  [
    // terminators
    { name: 'extensible', assertion: 'to be extensible' },
    { name: 'frozen', assertion: 'to be frozen' },
    { name: 'sealed', assertion: 'to be sealed' },
    { name: 'true', assertion: 'to be true' },
    { name: 'false', assertion: 'to be false' },
    { name: 'null', assertion: 'to be null' },
    { name: 'undefined', assertion: 'to be undefined' },
    { name: 'empty', assertion: 'to be empty' },
    { name: 'NaN', assertion: 'to be NaN' },
    // functions
    {
      name: 'ok',
      assertion: flags => (flags.not ? 'to be falsy' : 'to be truthy')
    },
    { name: 'be', assertion: 'to be' },
    {
      name: 'equal',
      assertion: flags => (flags.deep ? '[not] to deeply equal' : '[not] to be')
    },
    { name: 'eql', assertion: 'to deeply equal' },
    { name: 'match', assertion: 'to match' },
    { name: 'matches', assertion: 'to match' },
    { name: 'contains', assertion: 'to contain' },
    { name: 'include', assertion: 'to include' },
    { name: 'string', assertion: 'to contain' },
    { name: 'length', assertion: 'to have length' },
    { name: 'lengthOf', assertion: 'to have length' },
    { name: 'oneOf', assertion: 'to be one of' },
    { name: 'approximately', assertion: 'to be close to', numArgs: 2 },
    { name: 'closeTo', assertion: 'to be close to', numArgs: 2 },
    {
      name: 'within',
      numArgs: 2,
      assertion: flags =>
        flags.length ? '[not] to have length within' : '[not] to be within'
    },
    { name: 'greaterThan', assertion: 'to be greater than' },
    {
      name: 'above',
      assertion: flags =>
        flags.length ? '[not] to have length above' : '[not] to be above'
    },
    { name: 'lessThan', assertion: 'to be less than' },
    {
      name: 'below',
      assertion: flags =>
        flags.length ? '[not] to have length below' : '[not] to be below'
    }
  ].forEach(function(methodDefinition) {
    ExpectFacade.prototype[methodDefinition.name] = function(...args) {
      var numArgs = methodDefinition.numArgs;
      var assertion;
      if (typeof methodDefinition.assertion === 'function') {
        assertion = methodDefinition.assertion(this.flags);
      } else {
        assertion = '[not] ' + methodDefinition.assertion;
      }

      this._unexpectedAssert(assertion, args, numArgs);
    };
  });

  function expect(subject, ...rest) {
    if (rest.length > 0) {
      throw new Error('Expect takes at most one argument.');
    }

    return new ExpectFacade(subject);
  }

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

  var addAssertionRegistry = new StringKeysMap();

  expect.addAssertion = (pattern, handler) => {
    var path = stripTypes(expandFlags(pattern, {})).split(' ');
    if (path.length < 1 || path[0] === '') {
      throw new Error('cannot define empty assertion');
    }

    var assertionName = path[path.length - 1];
    if (
      ExpectFacade.prototype[assertionName] &&
      !ExpectFacade.prototype[assertionName]._isCustomAssertion
    ) {
      throw new Error(
        `cannot redefine existing assertion "${assertionName}()"`
      );
    }

    // register with unexpected
    unexpected.addAssertion(pattern, handler);

    // add dotted properties
    var parts = [...path];
    var part;
    while (parts.length > 1) {
      part = parts.shift();

      if (!flags[part]) {
        flags[part] = true;
      }
    }

    var assertionString = stripTypes(pattern);
    addAssertionRegistry.setByKeys(path, assertionString);

    // add assertion function
    ExpectFacade.prototype[assertionName] = function(...args) {
      var keys = Object.keys(this.flags);
      var assertion = addAssertionRegistry.getByKeys(keys);
      if (!assertion) {
        throw new Error('incomplete flags for custom assertion');
      }
      return this._unexpectedAssert(assertion, args);
    };
    ExpectFacade.prototype[assertionName]._isCustomAssertion = true;
  };

  expect.version = '0.0.0';

  expect.unexpected = unexpected;

  return expect;
}

module.exports = expectTheUnexpected(require('unexpected'));
