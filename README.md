# cup-of-unexpected

A reimplementation of the
[chaijs.expect](https://www.chaijs.com/guide/styles/#expect)
interface using
[Unexpected](https://github.com/unexpectedjs/unexpected).

[![NPM version](https://img.shields.io/npm/v/cup-of-unexpected.svg)](https://www.npmjs.com/package/cup-of-unexpected)
[![Build Status](https://img.shields.io/travis/alexjeffburke/cup-of-unexpected/master.svg)](https://travis-ci.org/alexjeffburke/ecup-of-unexpected)
[![Coverage Status](https://img.shields.io/coveralls/alexjeffburke/cup-of-unexpected/master.svg)](https://coveralls.io/r/alexjeffburke/cup-of-unexpected?branch=master)

This module intends to be a drop-in replacement for projects using
the expect() interface of the Chai Assertion Library. The set of
supported assertions is close both in terms of API and behaviour
as is possible.

## Getting started

Take the following test suite:

```javascript
var chai = require('chai');
var expect = chai.expect;

describe('add', function() {
  it('should return a number', function() {
    var result = add(1, 2);
    expect(result).to.be.a('number');
  });

  it('should add to numbers correctly', function() {
    var result = add(2, 2);
    expect(result).to.eql(3);
  });
});
```

With cup-of-unexpected installed:

```
$ npm install --save-dev expect-the-unexpected
```

Switching the test suite over is as simple as:

```diff
-var chai = require('chai');
+var chai = require('cup-of-unexpected');
```

Any tests you're written will continue to execute unchaged.

## Unsupported features

The primary functionality that we do not currently support is plugins.

## Custom Assertions

While chai plugins are not suported the library does support the use
of Unexpected plugins. These are implemented differrently and are
localised to an instance of `expect` being used to avoid having any
extensions bleed over into other parts of the test suite.

Let's use an example of an assertion intended to be used in the
browser to check whether a particular DOM node has a CSS class.
We can implement this using the Unexpected assertion syntax and
add it directly via the fully compatible `addAssertion()` API:

```javascript
expect.addAssertion('[not] to have css class', function(
  expect,
  subject,
  value
) {
  var $element = $(subject);
  var elementClasses = ($element.attr('class') || '').split(' ');
  expect(elementClasses, '[not] to contain', value);
});
```

The assertion can then be used like any other expect assertion by using its
dotted path name:

```javascript
var html = '<div class="foo bar baz"></div>';

expect(html).to.have.css.class('foo');
```

## License

This module is published under the ISC license.
See the [LICENSE](LICENSE) file for details.
