const unexpected = require('unexpected')
  .clone()
  .use(require('./localAssertions'));

const makeError = require('./makeError');

function Assertion(object) {
  const ExpectFacade = require('./ExpectFacade');
  return new ExpectFacade(object, null, { unexpected });
}

// unsupported
Assertion.prototype.change = function() {
  throw new Error('The change() assertion is not supported.');
};

Assertion.prototype.decrease = function() {
  throw new Error('The decrease() assertion is not supported.');
};

Assertion.prototype.increase = function() {
  throw new Error('The increase() assertion is not supported.');
};

Assertion.prototype.respondTo = function() {
  throw new Error('The respondTo() assertion is not supported.');
};

// assertions
Assertion.prototype.a = function(...args) {
  if (args[0] === 'number') {
    return this._unexpectedAssert('[not] to be a number', args.slice(1), 0);
  }

  return this._unexpectedAssert('[not] to be a', args, 1);
};
Assertion.prototype.an = Assertion.prototype.a;
Assertion.prototype.instanceof = Assertion.prototype.a;

Assertion.prototype.keys = function(...args) {
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
Assertion.prototype.key = Assertion.prototype.keys;

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

  let descriptor;
  if (
    (descriptor = Object.getOwnPropertyDescriptor(this.subject, args[0])) &&
    descriptor.get
  ) {
    if (numArgs === 2) {
      this._internals.unexpected(this.subject[args[0]], 'to equal', args[1]);
    }
  } else {
    this._unexpectedAssert('[not] to have a property', args, numArgs);
  }
  return { _capture: true, nextSubject: this.subject[args[0]] };
}

Assertion.prototype.members = function(...args) {
  this._unexpectedAssert('[not] to include [deep] members', args, 1);
};

Assertion.prototype.property = function(...args) {
  this.flags.a = true;
  return handleProperty.apply(this, args);
};

Assertion.prototype.ownProperty = function(...args) {
  this.flags.own = true;
  return handleProperty.apply(this, args);
};

Assertion.prototype.haveOwnProperty = function(...args) {
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

Assertion.prototype.ownPropertyDescriptor = function(...args) {
  return handleOwnPropertyDescriptor.apply(this, args);
};

Assertion.prototype.haveOwnPropertyDescriptor = function(...args) {
  return handleOwnPropertyDescriptor.apply(this, args);
};

Assertion.prototype.satisfy = function(value, msg) {
  if (!value(this.subject)) {
    try {
      unexpected.fail(output => {
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

Assertion.prototype.throw = function(...args) {
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

Assertion.prototype.withArgs = function(...args) {
  var result = new Assertion(this.subject);
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
  Assertion.prototype[methodDefinition.name] = function(...args) {
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

// mark inbuilt assertions to allow telling them apart from any added by plugins
for (const assertionFunction of Object.values(Assertion.prototype)) {
  if (typeof assertionFunction !== 'function') continue;
  assertionFunction._isInbuiltAssertion = true;
}

const util = {
  flag(source, name) {
    if (name === 'object') {
      return source.subject;
    }
    return source.flags[name];
  },
  addMethod(target, name, handler) {
    target[name] = handler;
  },
  addProperty() {},
  addChainableMethod() {},
  overwriteProperty() {},
  overwriteMethod() {},
  overwriteChainableMethod() {}
};

// static
Assertion._unexpected = unexpected;

Assertion.addMethod = function(name, fn) {
  util.addMethod(this.prototype, name, fn);
};

Assertion.addProperty = function(name, fn) {
  util.addProperty(this.prototype, name, fn);
};

Assertion.addChainableMethod = function(name, fn, chainingBehavior) {
  util.addChainableMethod(this.prototype, name, fn, chainingBehavior);
};

Assertion.overwriteProperty = function(name, fn) {
  util.overwriteProperty(this.prototype, name, fn);
};

Assertion.overwriteMethod = function(name, fn) {
  util.overwriteMethod(this.prototype, name, fn);
};

Assertion.overwriteChainableMethod = function(name, fn, chainingBehavior) {
  util.overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
};

Assertion.util = util;

module.exports = Assertion;
