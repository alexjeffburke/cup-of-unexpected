const AssertionError = require('assertion-error');
const StringKeysMap = require('./StringKeysMap');

function expectTheUnexpected(unexpected) {
    unexpected = unexpected.clone();

    function extend(obj, ...args) {
        args.forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    }

    function expandFlags(pattern, flags) {
        return pattern
            .replace(/\[(!?)([^\]]+)\] ?/g, function(match, negate, flag) {
                return Boolean(flags[flag]) !== Boolean(negate)
                    ? flag + ' '
                    : '';
            })
            .trim();
    }

    function makeError(err, options) {
        err = err || {};
        options = options || {};

        var assertionError = new AssertionError(err.message);
        assertionError.stack =
            err.stack && err.stack.replace(assertionError.message, err.message);

        // quack a little more like an Unexpected error
        assertionError.originalError = err;
        assertionError.getErrorMessage = format => {
            return assertionError.originalError.getErrorMessage(format);
        };

        return assertionError;
    }

    function stripTypes(pattern) {
        return pattern
            .replace(/(<[a-zA-z-]+[+?]?(?:[|][a-zA-z-]+)*>[ ]?)/g, '')
            .trim();
    }

    var flags = {
        not: ['to', 'be', 'have', 'include', 'only'],
        to: ['be', 'have', 'include', 'only', 'not'],
        only: ['have'],
        have: ['own'],
        be: []
    };
    var flagsAssertions = {
        be: [
            'a',
            'an',
            'ok',
            'within',
            'empty',
            'above',
            'greaterThan',
            'below',
            'lessThan'
        ]
    };

    function defineNextStep(prop, parent, stepFlags) {
        stepFlags = stepFlags || flags;

        Object.defineProperty(parent, prop, {
            get: function() {
                var obj = new ExpectFacade(parent.subject, stepFlags[prop]);
                obj.flags = extend({}, parent.flags);
                obj.flags[prop] = true;

                if (typeof ExpectFacade.prototype[prop] === 'function') {
                    var fn = function(...args) {
                        ExpectFacade.prototype[prop].apply(obj, args);

                        // allow chaining with .and.
                        defineNextStep('and', obj, { and: flags.to });

                        return obj;
                    };

                    if (flagsAssertions[prop]) {
                        var assertions = flagsAssertions[prop];
                        assertions
                            .concat(flags[prop] || [])
                            .forEach(function(flag) {
                                defineNextStep(flag, fn);
                            });
                    }

                    fn.flags = obj.flags;
                    fn.subject = obj.subject;

                    return fn;
                }

                return obj;
            }
        });
    }

    function ExpectFacade(subject, nextSteps) {
        var that = this;

        this.flags = {};
        this.subject = subject;

        if (nextSteps) {
            nextSteps.forEach(function(prop) {
                defineNextStep(prop, that);
            });
        }
    }

    ExpectFacade.prototype._unexpectedAssert = function(assertion, args) {
        try {
            return unexpected(
                this.subject,
                expandFlags(assertion, this.flags),
                ...args
            );
        } catch (e) {
            throw makeError(e);
        }
    };

    ExpectFacade.prototype.withArgs = function(...args) {
        var result = new ExpectFacade(this.subject, Object.keys(flags));
        var subject = this.subject;
        result.flags = this.flags;
        result.subject = function() {
            return subject.apply(null, args);
        };
        return result;
    };

    [
        { name: 'ok', assertion: 'to be ok' },
        { name: 'be', assertion: 'to be' },
        { name: 'equal', assertion: 'to be' },
        { name: 'a', assertion: 'to be a' },
        { name: 'an', assertion: 'to be an' },
        { name: 'eql', assertion: 'to equal' },
        { name: 'match', assertion: 'to match' },
        { name: 'contain', assertion: 'to contain' },
        { name: 'string', assertion: 'to contain' },
        { name: 'length', assertion: 'to have length' },
        { name: 'empty', assertion: 'to be empty' },
        { name: 'key', assertion: 'to [only] have key' },
        { name: 'keys', assertion: 'to [only] have keys' },
        { name: 'property', assertion: 'to have [own] property' },
        { name: 'properties', assertion: 'to have [own] properties' },
        { name: 'throw', assertion: 'to throw', useExpectIt: true },
        { name: 'throwError', assertion: 'to throw', useExpectIt: true },
        { name: 'throwException', assertion: 'to throw', useExpectIt: true },
        { name: 'within', assertion: 'to be within' },
        { name: 'greaterThan', assertion: 'to be greater than' },
        { name: 'above', assertion: 'to be above' },
        { name: 'lessThan', assertion: 'to be less than' },
        { name: 'below', assertion: 'to be below' }
    ].forEach(function(methodDefinition) {
        ExpectFacade.prototype[methodDefinition.name] = function(...args) {
            if (
                methodDefinition.useExpectIt &&
                args.length === 1 &&
                typeof args[0] === 'function'
            ) {
                args[0] = unexpected.it(args[0]);
            }
            return this._unexpectedAssert(
                '[not] ' + methodDefinition.assertion,
                args
            );
        };
    });

    ExpectFacade.prototype.fail = (...args) => unexpected.fail(...args);

    function expect(subject, ...rest) {
        if (rest.length > 0) {
            throw new Error('Expect takes at most one argument.');
        }

        return new ExpectFacade(subject, Object.keys(flags));
    }

    expect.fail = (...args) => unexpected.fail(...args);
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
        var nextPart;
        while (parts.length > 1) {
            part = parts.shift();
            nextPart = parts[0];

            if (!flags[part]) {
                flags[part] = [nextPart];
            } else if (flags[part].indexOf(nextPart) === -1) {
                flags[part].push(nextPart);
            }
        }

        var assertionString = stripTypes(pattern);
        addAssertionRegistry.setByKeys(path, assertionString);

        // add assertion function
        ExpectFacade.prototype[assertionName] = function(...args) {
            var assertion = addAssertionRegistry.getByKeys(
                Object.keys(this.flags)
            );
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
