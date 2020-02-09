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
    'to',
    'with'
];
const TERMINATORS = [
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
            expect(
                isBoxedNumber,
                expect.flags.not ? 'to be false' : 'to be true'
            );
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
            if (
                typeof subject === 'string' ||
                expect.subjectType.is('array-like')
            ) {
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
                        const result = ExpectFacade.prototype[prop].apply(
                            scope,
                            args
                        );

                        let nextSubject;
                        if (result && result._capture) {
                            nextSubject = result.nextSubject;
                        } else {
                            nextSubject = scope.subject;
                        }

                        return new ExpectFacade(nextSubject, ['and']);
                    };

                    const extraFlags = assertionNamesFrom(
                        ExpectFacade.prototype
                    );

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
            throw new Error(
                'The "deep" flag is not supported with property().'
            );
        }

        let numArgs;
        if (args.length === 1) {
            numArgs = 1;
        } else if (this.flags.not) {
            throw new Error(
                'The "not" flag with a value is unsafe in property().'
            );
        } else {
            numArgs = 2;
        }

        this._unexpectedAssert('[not] to have a property', args, numArgs);
        return { _capture: true, nextSubject: this.subject[args[0]] };
    }

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
            assertion: flags =>
                flags.deep ? '[not] to deeply equal' : '[not] to be'
        },
        { name: 'eql', assertion: 'to deeply equal' },
        { name: 'match', assertion: 'to match' },
        { name: 'matches', assertion: 'to match' },
        { name: 'contain', assertion: 'to contain' },
        { name: 'include', assertion: 'to include' },
        { name: 'string', assertion: 'to contain' },
        { name: 'length', assertion: 'to have length' },
        { name: 'lengthOf', assertion: 'to have length' },
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

            this._unexpectedAssert(assertion, args, numArgs);
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
