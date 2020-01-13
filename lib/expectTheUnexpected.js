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
        { name: 'string', assertion: 'to contain' }, // TODO: expect('foobar').to.include.string('foo')
        { name: 'length', assertion: 'to have length' },
        { name: 'empty', assertion: 'to be empty' },
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
            var assertion = expandFlags(
                '[not] ' + methodDefinition.assertion,
                this.flags
            );

            if (
                methodDefinition.useExpectIt &&
                args.length === 1 &&
                typeof args[0] === 'function'
            ) {
                args[0] = unexpected.it(args[0]);
            }

            unexpected.apply(unexpected, [this.subject, assertion, ...args]);
        };
    });

    ['property', 'properties'].forEach(function(methodName) {
        ExpectFacade.prototype[methodName] = function(...args) {
            var assertion = expandFlags(
                '[not] to have [own] ' + methodName,
                this.flags
            );

            unexpected.apply(unexpected, [this.subject, assertion, ...args]);
        };
    });

    ['key', 'keys'].forEach(function(methodName) {
        ExpectFacade.prototype[methodName] = function(...args) {
            var assertion = expandFlags(
                '[not] to [only] have ' + methodName,
                this.flags
            );

            unexpected.apply(unexpected, [this.subject, assertion, ...args]);
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

    expect.addAssertion = (pattern, handler, ...rest) => {
        // register with unexpected
        unexpected.addAssertion(pattern, handler);

        var path = stripTypes(expandFlags(pattern, {})).split(' ');

        // add dotted properties
        var part;
        while (path.length > 1) {
            part = path.shift();
            if (!flags[part]) {
                flags[part] = [path[0]];
            } else if (flags[part].indexOf(path[0]) === -1) {
                flags[part].push(path[0]);
            }
        }

        // add assertion function
        var assertionName = path.shift();
        var assertionString = stripTypes(pattern);
        ExpectFacade.prototype[assertionName] = function(...args) {
            unexpected.apply(unexpected, [
                this.subject,
                expandFlags(assertionString, this.flags),
                ...args
            ]);
        };
    };

    expect.version = '0.0.0';

    expect.unexpected = unexpected;

    return expect;
}

module.exports = expectTheUnexpected(require('unexpected'));