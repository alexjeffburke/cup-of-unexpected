const Assertion = require('./Assertion');
const expandFlags = require('./expandFlags');
const makeError = require('./makeError');
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

function addToSet(set, things) {
  for (const thing of things) {
    set.add(thing);
  }
}

function assertionNamesFrom(obj) {
  return Object.keys(obj).filter(
    prop => !prop.startsWith('_') && typeof obj[prop] === 'function'
  );
}

function getterNamesFrom(obj) {
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  const names = [];
  for (const [name, descriptor] of Object.entries(descriptors)) {
    if (typeof descriptor.get === 'function') {
      names.push(name);
    }
  }
  return names;
}

function defineSteps(obj, scope, extraFlags) {
  const flagNames = Object.keys(ExpectFacade.flags);
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

      // check for plugin
      let descriptor;
      if (
        (descriptor = Object.getOwnPropertyDescriptor(
          Assertion.prototype,
          prop
        )) &&
        descriptor.get
      ) {
        return Assertion.prototype[prop];
      }

      if (ExpectFacade.terminators[prop]) {
        Assertion.prototype[prop].call(scope);
        return;
      }

      if (typeof Assertion.prototype[prop] === 'function') {
        var fn = function(...args) {
          const result = Assertion.prototype[prop].apply(scope, args);

          // return the result directly if it was added by a plugin
          if (!Assertion.prototype[prop]._isInbuiltAssertion) {
            return result;
          }

          let nextSubject;
          if (result && result._capture) {
            nextSubject = result.nextSubject;
          } else {
            nextSubject = scope.subject;
          }

          return new ExpectFacade(nextSubject, ['and'], scope._internals);
        };

        const extraFlags = assertionNamesFrom(Assertion.prototype);

        defineSteps(fn, scope, extraFlags);

        return fn;
      }

      return obj;
    }
  });
}

function ExpectFacade(subject, extraFlags, _internals) {
  this.flags = {};
  this.subject = subject;
  this.chainSubject = null;

  // define internals
  this._internals = _internals;

  // define top level properties
  defineSteps(this, this, extraFlags);

  // define assertion getters to ensure results are always wrapped
  const assertionFlags = new Set();
  addToSet(assertionFlags, assertionNamesFrom(Assertion.prototype));
  addToSet(assertionFlags, getterNamesFrom(Assertion.prototype));
  defineStepsIfMissing(this, this, Array.from(assertionFlags));

  // expose chai compatible properties
  Object.defineProperty(this, '_obj', {
    get: () => {
      return this.subject;
    },
    set: value => {
      this.subject = value;
    }
  });
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
    return this._internals.unexpected(
      this.subject,
      expandFlags(assertion, this.flags),
      ...args
    );
  } catch (e) {
    throw makeError(e, msg);
  }
};

// take a moment to define a propter containing bookkeeping data
// for the facade e.g. the active set of flags and teminators
const flags = {};
for (const flag of FLAGS) {
  flags[flag] = true;
}

const terminators = {};
for (const prop of TERMINATORS) {
  terminators[prop] = true;
}

module.exports = ExpectFacade;
module.exports.flags = flags;
module.exports.terminators = terminators;

const addAssertionRegistry = new StringKeysMap();

function stripTypes(pattern) {
  return pattern
    .replace(/(<[a-zA-z-]+[+?]?(?:[|][a-zA-z-]+)*>[ ]?)/g, '')
    .trim();
}

module.exports.addAssertion = function(pattern, handler) {
  var path = stripTypes(expandFlags(pattern, {})).split(' ');
  if (path.length < 1 || path[0] === '') {
    throw new Error('cannot define empty assertion');
  }

  var assertionName = path[path.length - 1];
  if (
    Assertion.prototype[assertionName] &&
    !Assertion.prototype[assertionName]._isCustomAssertion
  ) {
    throw new Error(`cannot redefine existing assertion "${assertionName}()"`);
  }

  // register with unexpected
  Assertion._unexpected.addAssertion(pattern, handler);

  // add dotted properties
  var activeFlags = ExpectFacade.flags;
  var parts = [...path];
  var part;
  while (parts.length > 1) {
    part = parts.shift();

    if (!activeFlags[part]) {
      activeFlags[part] = true;
    }
  }

  var assertionString = stripTypes(pattern);
  addAssertionRegistry.setByKeys(path, assertionString);

  // add assertion function
  Assertion.prototype[assertionName] = function(...args) {
    var keys = Object.keys(this.flags);
    var assertion = addAssertionRegistry.getByKeys(keys);
    if (!assertion) {
      throw new Error('incomplete flags for custom assertion');
    }
    return this._unexpectedAssert(assertion, args);
  };
  Assertion.prototype[assertionName]._isCustomAssertion = true;
};
