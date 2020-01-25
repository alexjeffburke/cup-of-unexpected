const AssertionError = require('assertion-error');
const StringKeysMap = require('./StringKeysMap');

function expectTheUnexpected(unexpected) {
    unexpected = unexpected.clone();

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

    unexpected.addAssertion(
        '<any> [not] to be undefined',
        (expect, subject) => {
            if (typeof subject !== 'undefined' && expect.flags.not) return;
            expect(subject, 'to equal', undefined);
        }
    );

    unexpected.addAssertion(
        '<object> [not] to be a number',
        (expect, subject) => {
            var isBoxedNumber = subject instanceof Number;
            expect(
                isBoxedNumber,
                expect.flags.not ? 'to be false' : 'to be true'
            );
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
        '<array-like|string> [not] to have length within <number> <number>',
        (expect, subject, start, finish) => {
            expect.errorMode = 'nested';
            expect(subject.length, 'to be within', start, finish);
        }
    );

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

    var terminators = ['ok', 'true', 'false', 'null', 'undefined'];
    var flags = {
        not: ['to', 'be', 'have', 'include', 'only'],
        to: ['an', 'be', 'have', 'include', 'only', 'not'],
        only: ['have'],
        have: ['length', 'own'],
        be: [],
        an: []
    };
    var flagsAssertions = {
        an: ['instanceof'],
        be: [
            'a',
            'an',
            'within',
            'empty',
            'above',
            'greaterThan',
            'below',
            'lessThan',
            ...terminators
        ],
        length: ['above', 'below', 'within']
    };

    function defineNextStep(prop, parent, stepFlags) {
        stepFlags = stepFlags || flags;

        Object.defineProperty(parent, prop, {
            get: function() {
                var obj = new ExpectFacade(parent.subject, stepFlags[prop]);
                obj.flags = extend({}, parent.flags);
                obj.flags[prop] = true;

                if (terminators.indexOf(prop) > -1) {
                    var check = obj[prop];
                    check.call(obj);
                    return;
                }

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

    ExpectFacade.prototype.a = function(...args) {
        if (args[0] === 'number') {
            return this._unexpectedAssert(
                '[not] to be a number',
                args.slice(1),
                0
            );
        }

        return this._unexpectedAssert('[not] to be a', args, 1);
    };
    ExpectFacade.prototype.an = ExpectFacade.prototype.a;
    ExpectFacade.prototype.instanceof = ExpectFacade.prototype.a;

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
        // terminators
        { name: 'true', assertion: 'to be true' },
        { name: 'false', assertion: 'to be false' },
        { name: 'null', assertion: 'to be null' },
        { name: 'undefined', assertion: 'to be undefined' },
        // functions
        {
            name: 'ok',
            assertion: flags => (flags.not ? 'to be falsy' : 'to be truthy')
        },
        { name: 'be', assertion: 'to be' },
        { name: 'equal', assertion: 'to be' },
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
        {
            name: 'within',
            numArgs: 2,
            assertion: flags =>
                flags.length
                    ? '[not] to have length within'
                    : '[not] to be within'
        },
        { name: 'greaterThan', assertion: 'to be greater than' },
        {
            name: 'above',
            assertion: flags =>
                flags.length
                    ? '[not] to have length above'
                    : '[not] to be above'
        },
        { name: 'lessThan', assertion: 'to be less than' },
        {
            name: 'below',
            assertion: flags =>
                flags.length
                    ? '[not] to have length below'
                    : '[not] to be below'
        }
    ].forEach(function(methodDefinition) {
        ExpectFacade.prototype[methodDefinition.name] = function(...args) {
            if (
                methodDefinition.useExpectIt &&
                args.length === 1 &&
                typeof args[0] === 'function'
            ) {
                args[0] = unexpected.it(args[0]);
            }

            var numArgs = methodDefinition.numArgs;
            var assertion;
            if (typeof methodDefinition.assertion === 'function') {
                assertion = methodDefinition.assertion(this.flags);
            } else {
                assertion = '[not] ' + methodDefinition.assertion;
            }

            return this._unexpectedAssert(assertion, args, numArgs);
        };
    });

    ExpectFacade.prototype.fail = (...args) => {
        let messageOrObject;
        if (args.length > 1) {
            messageOrObject = args[2] || '';
        } else {
            messageOrObject = args[0];
        }
        unexpected.fail(messageOrObject);
    };

    function expect(subject, ...rest) {
        if (rest.length > 0) {
            throw new Error('Expect takes at most one argument.');
        }

        return new ExpectFacade(subject, Object.keys(flags));
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
