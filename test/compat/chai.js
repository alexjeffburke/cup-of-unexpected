var unexpected = require('unexpected');
var expect = require('../../');

/**
 * Module dependencies.
 */

function err(fn, msg) {
  unexpected(() => {
    fn();
  }, 'to throw', unexpected.it(error => {
    unexpected(error.getErrorMessage('text').toString(), 'to satisfy', msg);
  }));
}

function errIgnoringMessage(fn, msg) {
  unexpected(() => {
    fn();
  }, 'to throw');
}

describe('compat/chai', function () {
  /*
  it('chai.version', function() {
    expect(chai).to.have.property('version');
  });
  */

  it('assertion', function(){
    expect('test').to.be.a('string');
    expect('foo').to.equal('foo');
  });

  it('fail', function () {
    err(function() {
      expect.fail(0, 1, 'this has failed');
    }, /this has failed/);
  });

  it('true', function(){
    expect(true).to.be.true;
    expect(false).to.not.be.true;
    expect(1).to.not.be.true;

    err(function(){
      expect('test').to.be.true;
    }, "expected 'test' to be true")
  });

  it('ok', function(){
    expect(true).to.be.ok;
    expect(false).to.not.be.ok;
    expect(1).to.be.ok;
    expect(0).to.not.be.ok;

    err(function(){
      expect('').to.be.ok;
    }, "expected '' to be truthy");

    err(function(){
      expect('test').to.not.be.ok;
    }, "expected 'test' to be falsy");
  });

  it('false', function(){
    expect(false).to.be.false;
    expect(true).to.not.be.false;
    expect(0).to.not.be.false;

    err(function(){
      expect('').to.be.false;
    }, "expected '' to be false")
  });

  it('null', function(){
    expect(null).to.be.null;
    expect(false).to.not.be.null;

    err(function(){
      expect('').to.be.null;
    }, "expected '' to be null")

  });

  it('undefined', function(){
    expect(undefined).to.be.undefined;
    expect(null).to.not.be.undefined;

    err(function(){
      expect('').to.be.undefined;
    }, "expected '' to be undefined")
  });

  it('exist', function(){
    var foo = 'bar'
      , bar;
    expect(foo).to.exist;
    expect(bar).to.not.exist;
  });

  it('arguments', function(){
    var args = (function(){ return arguments; })(1,2,3);
    expect(args).to.be.arguments;
    expect([]).to.not.be.arguments;
    expect(args).to.be.an('arguments').and.be.arguments;
    expect([]).to.be.an('array').and.not.be.Arguments;
  });

  it('.equal()', function(){
    var foo;
    expect(undefined).to.equal(foo);

    err(function(){
      expect(undefined).to.equal(null);
    }, "expected undefined to be null") // Used to be: expected undefined to equal null
  });

  it('typeof', function(){
    expect('test').to.be.a('string');

    err(function(){
      expect('test').to.not.be.a('string');
    }, "expected 'test' not to be a string");

    (function () {
      expect(arguments).to.be.an('arguments');
    })(1, 2);

    expect(5).to.be.a('number');
    expect(new Number(1)).to.be.a('number');
    expect(Number(1)).to.be.a('number');
    expect(true).to.be.a('boolean');
    expect(new Array()).to.be.a('array');
    expect(new Object()).to.be.a('object');
    expect({}).to.be.a('object');
    expect([]).to.be.a('array');
    expect(function() {}).to.be.a('function');
    expect(null).to.be.a('null');

    err(function(){
      expect(5).to.not.be.a('number', 'blah');
    }, "blah: expected 5 not to be a number");
  });

  it('instanceof', function(){
    function Foo(){}
    expect(new Foo()).to.be.an.instanceof(Foo);

    err(function(){
      expect(3).to.an.instanceof(Foo, 'blah');
    }, "blah: expected 3 to be a Foo"); // TODO: used to be: "blah: expected 3 to be an instance of Foo"
  });

  it('within(start, finish)', function(){
    expect(5).to.be.within(5, 10);
    expect(5).to.be.within(3,6);
    expect(5).to.be.within(3,5);
    expect(5).to.not.be.within(1,3);
    expect('foo').to.have.length.within(2,4);
    expect([ 1, 2, 3 ]).to.have.length.within(2,4);

    err(function(){
      expect(5).to.not.be.within(4,6, 'blah');
    }, "blah: expected 5 not to be within 4..6", 'blah');

    err(function(){
      expect(10).to.be.within(50,100, 'blah');
    }, "blah: expected 10 to be within 50..100");

    err(function () {
      expect('foo').to.have.length.within(5,7, 'blah');
    }, /^blah: expected 'foo' to have length within 5, 7/); // TODO: used to be: "blah: expected \'foo\' to have a length within 5..7"

    err(function () {
      expect([ 1, 2, 3 ]).to.have.length.within(5,7, 'blah');
    }, /^blah: expected \[ 1, 2, 3 \] to have length within 5, 7/); // TODO: used to be: "blah: expected [ 1, 2, 3 ] to have a length within 5..7"
  });

  it('above(n)', function(){
    expect(5).to.be.above(2);
    expect(5).to.be.greaterThan(2);
    expect(5).to.not.be.above(5);
    expect(5).to.not.be.above(6);
    expect('foo').to.have.length.above(2);
    expect([ 1, 2, 3 ]).to.have.length.above(2);

    err(function(){
      expect(5).to.be.above(6, 'blah');
    }, "blah: expected 5 to be above 6", 'blah');

    err(function(){
      expect(10).to.not.be.above(6, 'blah');
    }, "blah: expected 10 not to be above 6"); // TODO: used to be: "blah: expected 10 to be at most 6"

    err(function () {
      expect('foo').to.have.length.above(4, 'blah');
    }, /^blah: expected 'foo' to have length above 4/); // TODO: used to be: "blah: expected \'foo\' to have a length above 4 but got 3"

    err(function () {
      expect([ 1, 2, 3 ]).to.have.length.above(4, 'blah');
    }, /^blah: expected \[ 1, 2, 3 \] to have length above 4/); // TODO: usde to be: "blah: expected [ 1, 2, 3 ] to have a length above 4 but got 3"
  });

  it.skip('least(n)', function(){
    expect(5).to.be.at.least(2);
    expect(5).to.be.at.least(5);
    expect(5).to.not.be.at.least(6);
    expect('foo').to.have.length.of.at.least(2);
    expect([ 1, 2, 3 ]).to.have.length.of.at.least(2);

    err(function(){
      expect(5).to.be.at.least(6, 'blah');
    }, "blah: expected 5 to be at least 6", 'blah');

    err(function(){
      expect(10).to.not.be.at.least(6, 'blah');
    }, "blah: expected 10 to be below 6");

    err(function () {
      expect('foo').to.have.length.of.at.least(4, 'blah');
    }, "blah: expected \'foo\' to have a length at least 4 but got 3");

    err(function () {
      expect([ 1, 2, 3 ]).to.have.length.of.at.least(4, 'blah');
    }, "blah: expected [ 1, 2, 3 ] to have a length at least 4 but got 3");

    err(function () {
      expect([ 1, 2, 3, 4 ]).to.not.have.length.of.at.least(4, 'blah');
    }, "blah: expected [ 1, 2, 3, 4 ] to have a length below 4");
  });

  it('below(n)', function(){
    expect(2).to.be.below(5);
    expect(2).to.be.lessThan(5);
    expect(2).to.not.be.below(2);
    expect(2).to.not.be.below(1);
    expect('foo').to.have.length.below(4);
    expect([ 1, 2, 3 ]).to.have.length.below(4);

    err(function(){
      expect(6).to.be.below(5, 'blah');
    }, "blah: expected 6 to be below 5");

    err(function(){
      expect(6).to.not.be.below(10, 'blah');
    }, "blah: expected 6 not to be below 10"); // TODO: used to be: "blah: expected 6 to be at least 10"

    err(function () {
      expect('foo').to.have.length.below(2, 'blah');
    }, /^blah: expected 'foo' to have length below 2/); // TODO: used to be: "blah: expected \'foo\' to have a length below 2 but got 3"

    err(function () {
      expect([ 1, 2, 3 ]).to.have.length.below(2, 'blah');
    }, /^blah: expected \[ 1, 2, 3 \] to have length below 2/); // TODO: used to be: "blah: expected [ 1, 2, 3 ] to have a length below 2 but got 3"
  });

  it.skip('most(n)', function(){
    expect(2).to.be.at.most(5);
    expect(2).to.be.at.most(2);
    expect(2).to.not.be.at.most(1);
    expect(2).to.not.be.at.most(1);
    expect('foo').to.have.length.of.at.most(4);
    expect([ 1, 2, 3 ]).to.have.length.of.at.most(4);

    err(function(){
      expect(6).to.be.at.most(5, 'blah');
    }, "blah: expected 6 to be at most 5");

    err(function(){
      expect(6).to.not.be.at.most(10, 'blah');
    }, "blah: expected 6 to be above 10");

    err(function () {
      expect('foo').to.have.length.of.at.most(2, 'blah');
    }, "blah: expected \'foo\' to have a length at most 2 but got 3");

    err(function () {
      expect([ 1, 2, 3 ]).to.have.length.of.at.most(2, 'blah');
    }, "blah: expected [ 1, 2, 3 ] to have a length at most 2 but got 3");

    err(function () {
      expect([ 1, 2 ]).to.not.have.length.of.at.most(2, 'blah');
    }, "blah: expected [ 1, 2 ] to have a length above 2");
  });

  it('match(regexp)', function(){
    expect('foobar').to.match(/^foo/)
    expect('foobar').to.matches(/^foo/)
    expect('foobar').to.not.match(/^bar/)

    err(function(){
      expect('foobar').to.match(/^bar/i, 'blah')
    }, "blah: expected 'foobar' to match /^bar/i");

    err(function(){
      expect('foobar').to.matches(/^bar/i, 'blah')
    }, "blah: expected 'foobar' to match /^bar/i");

    err(function(){
      expect('foobar').to.not.match(/^foo/i, 'blah')
    }, /^blah: expected 'foobar' not to match \/\^foo\/i/);
  });

  it('length(n)', function(){
    expect('test').to.have.length(4);
    expect('test').to.not.have.length(3);
    expect([1,2,3]).to.have.length(3);

    /* INCOMPATIBILITY
    err(function(){
      expect(4).to.have.length(3, 'blah');
    }, 'blah: expected 4 to have a property \'length\'');
    */

    err(function(){
      expect('asd').to.not.have.length(3, 'blah');
    }, "blah: expected 'asd' not to have length 3"); // TODO: used to be: "blah: expected 'asd' to not have a length of 3"
  });

  it('eql(val)', function(){
    expect('test').to.eql('test');
    expect({ foo: 'bar' }).to.eql({ foo: 'bar' });
    expect(1).to.eql(1);
    expect('4').to.not.eql(4);

    err(function(){
      expect(4).to.eql(3, 'blah');
    }, 'blah: expected 4 to deeply equal 3');
  });

  if ('undefined' !== typeof Buffer) {
    it('Buffer eql()', function () {
      expect(new Buffer([ 1 ])).to.eql(new Buffer([ 1 ]));

      err(function () {
        expect(new Buffer([ 0 ])).to.eql(new Buffer([ 1 ]));
      }, /expected Buffer.from\(\[0x00\]\) to deeply equal Buffer.from\(\[0x01\]\)/); // TODO: used to be: 'expected <Buffer 00> to deeply equal <Buffer 01>'
    });
  }

  it('equal(val)', function(){
    expect('test').to.equal('test');
    expect(1).to.equal(1);

    err(function(){
      expect(4).to.equal(3, 'blah');
    }, 'blah: expected 4 to be 3'); // TODO: used to be: 'blah: expected 4 to equal 3'

    err(function(){
      expect('4').to.equal(4, 'blah');
    }, "blah: expected '4' to be 4"); // TODO: used to be: "blah: expected '4' to equal 4"
  });

  it('deep.equal(val)', function(){
    expect({ foo: 'bar' }).to.deep.equal({ foo: 'bar' });
    expect({ foo: 'bar' }).not.to.deep.equal({ foo: 'baz' });
  });

  it('deep.equal(/regexp/)', function(){
    expect(/a/).to.deep.equal(/a/);
    expect(/a/).not.to.deep.equal(/b/);
    expect(/a/).not.to.deep.equal({});
    expect(/a/g).to.deep.equal(/a/g);
    expect(/a/g).not.to.deep.equal(/b/g);
    expect(/a/i).to.deep.equal(/a/i);
    expect(/a/i).not.to.deep.equal(/b/i);
    expect(/a/m).to.deep.equal(/a/m);
    expect(/a/m).not.to.deep.equal(/b/m);
  });

  it('deep.equal(Date)', function(){
    var a = new Date(1, 2, 3)
      , b = new Date(4, 5, 6);
    expect(a).to.deep.equal(a);
    expect(a).not.to.deep.equal(b);
    expect(a).not.to.deep.equal({});
  });

  it('empty', function(){
    function FakeArgs() {};
    FakeArgs.prototype.length = 0;

    expect('').to.be.empty;
    expect('foo').not.to.be.empty;
    expect([]).to.be.empty;
    expect(['foo']).not.to.be.empty;
    expect(new FakeArgs).to.be.empty;
    expect({arguments: 0}).not.to.be.empty;
    expect({}).to.be.empty;
    expect({foo: 'bar'}).not.to.be.empty;

    err(function(){
      expect('').not.to.be.empty;
    }, "expected \'\' not to be empty");

    err(function(){
      expect('foo').to.be.empty;
    }, "expected \'foo\' to be empty");

    err(function(){
      expect([]).not.to.be.empty;
    }, "expected [] not to be empty");

    err(function(){
      expect(['foo']).to.be.empty;
    }, "expected [ \'foo\' ] to be empty");

    err(function(){
      expect(new FakeArgs).not.to.be.empty;
    }, "expected FakeArgs({}) not to be empty"); // TODO: used to be: "expected { length: 0 } not to be empty"

    err(function(){
      expect({arguments: 0}).to.be.empty;
    }, /^expected { arguments: 0 } to be empty/);

    err(function(){
      expect({}).not.to.be.empty;
    }, "expected {} not to be empty");

    err(function(){
      expect({foo: 'bar'}).to.be.empty;
    }, /^expected { foo: 'bar' } to be empty/);
  });

  it('NaN', function() {
    expect(NaN).to.be.NaN;
    expect('foo').to.be.NaN;
    expect({}).to.be.NaN;
    expect(4).not.to.be.NaN;
    expect([]).not.to.be.NaN;

    err(function(){
      expect(4).to.be.NaN;
    }, "expected 4 to be NaN");

    /* INCOMPATIBILITY
    err(function(){
      expect([]).to.be.NaN;
    }, "expected [] to be NaN");
    */

    /* INCOMPATIBILITY
    err(function(){
      expect('foo').not.to.be.NaN;
    }, "expected 'foo' not to be NaN");
    */
  });

  it('property(name)', function(){
    expect('test').to.have.property('length');
    expect(4).to.not.have.property('length');

    expect({ 'foo.bar': 'baz' })
      .to.have.property('foo.bar');
    expect({ foo: { bar: 'baz' } })
      .to.not.have.property('foo.bar');

    // Properties with the value 'undefined' are still properties
    var obj = { foo: undefined };
    Object.defineProperty(obj, 'bar', {
      get: function() { }
    });
    expect(obj).to.have.property('foo');
    expect(obj).to.have.property('bar');

    expect({ 'foo.bar[]': 'baz'})
      .to.have.property('foo.bar[]');

    err(function(){
      expect('asd').to.have.property('foo');
    }, "expected 'asd' to have a property 'foo'");
    err(function(){
      expect({ foo: { bar: 'baz' } })
        .to.have.property('foo.bar');
    }, "expected { foo: { bar: 'baz' } } to have a property 'foo.bar'");
  });

  it.skip('deep.property(name)', function(){
    expect({ 'foo.bar': 'baz'})
      .to.not.have.deep.property('foo.bar');
    expect({ foo: { bar: 'baz' } })
      .to.have.deep.property('foo.bar');

    expect({ 'foo': [1, 2, 3] })
      .to.have.deep.property('foo[1]');

    expect({ 'foo.bar[]': 'baz'})
      .to.have.deep.property('foo\\.bar\\[\\]');

    err(function(){
      expect({ 'foo.bar': 'baz' })
        .to.have.deep.property('foo.bar');
    }, "expected { 'foo.bar': 'baz' } to have a deep property 'foo.bar'");
  });

  it('property(name, val)', function(){
    expect('test').to.have.property('length', 4);
    /* INCOMPATIBILITY
    expect('asd').to.have.property('constructor', String);
    */

    /* UNIMPLEMENTED
    var deepObj = {
        green: { tea: 'matcha' }
      , teas: [ 'chai', 'matcha', { tea: 'konacha' } ]
    };
    expect(deepObj).to.have.deep.property('green.tea', 'matcha');
    expect(deepObj).to.have.deep.property('teas[1]', 'matcha');
    expect(deepObj).to.have.deep.property('teas[2].tea', 'konacha');

    expect(deepObj).to.have.property('teas')
      .that.is.an('array')
      .with.deep.property('[2]')
        .that.deep.equals({tea: 'konacha'});

    err(function(){
      expect(deepObj).to.have.deep.property('teas[3]');
    }, "expected { Object (green, teas) } to have a deep property 'teas[3]'");
    err(function(){
      expect(deepObj).to.have.deep.property('teas[3]', 'bar');
    }, "expected { Object (green, teas) } to have a deep property 'teas[3]'");
    err(function(){
      expect(deepObj).to.have.deep.property('teas[3].tea', 'bar');
    }, "expected { Object (green, teas) } to have a deep property 'teas[3].tea'");

    var arr = [
        [ 'chai', 'matcha', 'konacha' ]
      , [ { tea: 'chai' }
        , { tea: 'matcha' }
        , { tea: 'konacha' } ]
    ];
    expect(arr).to.have.deep.property('[0][1]', 'matcha');
    expect(arr).to.have.deep.property('[1][2].tea', 'konacha');
    err(function(){
      expect(arr).to.have.deep.property('[2][1]');
    }, "expected [ Array(2) ] to have a deep property '[2][1]'");
    err(function(){
      expect(arr).to.have.deep.property('[2][1]', 'none');
    }, "expected [ Array(2) ] to have a deep property '[2][1]'");
    err(function(){
      expect(arr).to.have.deep.property('[0][3]', 'none');
    }, "expected [ Array(2) ] to have a deep property '[0][3]'");
    */

    err(function(){
      expect('asd').to.have.property('length', 4, 'blah');
    }, /^blah: expected 'asd' to have a property 'length', 4/); // TODO: used to be: "blah: expected 'asd' to have a property 'length' of 4, but got 3"

    /* INCOMPATIBLITY
    err(function(){
      expect('asd').to.not.have.property('length', 3, 'blah');
    }, "blah: expected 'asd' to not have a property 'length' of 3");

    err(function(){
      expect('asd').to.not.have.property('foo', 3, 'blah');
    }, "blah: 'asd' has no property 'foo'");

    err(function(){
      expect('asd').to.have.property('constructor', Number, 'blah');
    }, "blah: expected 'asd' to have a property 'constructor' of [Function: Number], but got [Function: String]");
    */
  });

  it.skip('deep.property(name, val)', function(){
    expect({ foo: { bar: 'baz' } })
      .to.have.deep.property('foo.bar', 'baz');

    err(function(){
      expect({ foo: { bar: 'baz' } })
        .to.have.deep.property('foo.bar', 'quux', 'blah');
    }, "blah: expected { foo: { bar: 'baz' } } to have a deep property 'foo.bar' of 'quux', but got 'baz'");
    err(function(){
      expect({ foo: { bar: 'baz' } })
        .to.not.have.deep.property('foo.bar', 'baz', 'blah');
    }, "blah: expected { foo: { bar: 'baz' } } to not have a deep property 'foo.bar' of 'baz'");
    err(function(){
      expect({ foo: 5 })
        .to.not.have.deep.property('foo.bar', 'baz', 'blah');
    }, "blah: { foo: 5 } has no deep property 'foo.bar'");
  });

  it('ownProperty(name)', function(){
    expect('test').to.have.ownProperty('length');
    expect('test').to.haveOwnProperty('length');
    expect({ length: 12 }).to.have.ownProperty('length');

    /* INCOMPATIBLITY
    err(function(){
      expect({ length: 12 }).to.not.have.ownProperty('length', 'blah');
    }, "blah: expected { length: 12 } to not have own property 'length'");
    */
  });

  it('ownPropertyDescriptor(name)', function(){
    expect('test').to.have.ownPropertyDescriptor('length');
    expect('test').to.haveOwnPropertyDescriptor('length');
    expect('test').not.to.have.ownPropertyDescriptor('foo');

    var obj = {};
    var descriptor = {
      configurable: false,
      enumerable: true,
      writable: true,
      value: NaN
    };
    Object.defineProperty(obj, 'test', descriptor);
    expect(obj).to.have.ownPropertyDescriptor('test', descriptor);

    /* INCOMPATIBLITY
    err(function(){
      expect(obj).not.to.have.ownPropertyDescriptor('test', descriptor, 'blah');
    }, /^blah: expected the own property descriptor for 'test' on \{ test: NaN \} to not match \{ [^\}]+ \}$/);
    */

    err(function(){
      var wrongDescriptor = {
        configurable: false,
        enumerable: true,
        writable: false,
        value: NaN
      };
      expect(obj).to.have.ownPropertyDescriptor('test', wrongDescriptor, 'blah');
    }, /to have own property descriptor 'test', { configurable: false, enumerable: true, writable: false, value: NaN }/); // TODO: used to be: /^blah: expected the own property descriptor for 'test' on \{ test: NaN \} to match \{ [^\}]+ \}, got \{ [^\}]+ \}$/

    err(function(){
      expect(obj).to.have.ownPropertyDescriptor('test2', 'blah');
    }, "blah: expected { test: NaN } to have own property descriptor 'test2'"); // TODO: used to be: "blah: expected { test: NaN } to have an own property descriptor for 'test2'"

    /* INCOMPATIBLITY
    expect(obj).to.have.ownPropertyDescriptor('test').and.have.property('enumerable', true);
    */
  });

  it('string()', function(){
    expect('foobar').to.have.string('bar');
    expect('foobar').to.have.string('foo');
    expect('foobar').to.not.have.string('baz');

    err(function(){
      expect(3).to.have.string('baz');
    }, "expected 3 to be a string");

    err(function(){
      expect('foobar').to.have.string('baz', 'blah');
    }, /^blah: expected 'foobar' to contain 'baz'/);

    err(function(){
      expect('foobar').to.not.have.string('bar', 'blah');
    }, /^blah: expected 'foobar' not to contain 'bar'/); // TODO: used to be: "blah: expected 'foobar' to not contain 'bar'"
  });

  it('include()', function(){
    expect(['foo', 'bar']).to.include('foo');
    expect(['foo', 'bar']).to.include('foo');
    expect(['foo', 'bar']).to.include('bar');
    expect([1,2]).to.include(1);
    expect(['foo', 'bar']).to.not.include('baz');
    expect(['foo', 'bar']).to.not.include(1);
    expect({a:1,b:2}).to.include({b:2});
    expect({a:1,b:2}).to.not.include({b:3});
    expect({a:1,b:2}).to.include({a:1,b:2});
    expect({a:1,b:2}).to.not.include({a:1,c:2});

    expect([{a:1},{b:2}]).to.include({a:1});
    expect([{a:1}]).to.include({a:1});
    expect([{a:1}]).to.not.include({b:1});

    err(function(){
      expect(['foo']).to.include('bar', 'blah');
    }, "blah: expected [ 'foo' ] to include 'bar'");

    err(function(){
      expect(['bar', 'foo']).to.not.include('foo', 'blah');
    }, /^blah: expected \[ 'bar', 'foo' \] not to include 'foo'/); // TODO: used to be: "blah: expected [ 'bar', 'foo' ] to not include 'foo'"

    err(function(){
      expect({a:1}).to.include({b:2});
    }, /expected { a: 1 } to include { b: 2 }/); // TODO: used to be: "expected { a: 1 } to have a property 'b'"

    err(function(){
      expect({a:1,b:2}).to.not.include({b:2});
    }, "expected { a: 1, b: 2 } not to include { b: 2 }"); // TODO: used to be: "expected { a: 1, b: 2 } to not include { b: 2 }"

    err(function(){
      expect([{a:1},{b:2}]).to.not.include({b:2});
    }, /^expected \[ { a: 1 }, { b: 2 } \] not to include { b: 2 }/); // TODO: used to be: "expected [ { a: 1 }, { b: 2 } ] to not include { b: 2 }"

    err(function(){
      expect(true).to.include(true);
    }, "object tested must be an array, an object, or a string, but boolean given");

    err(function(){
      expect(42.0).to.include(42);
    }, "object tested must be an array, an object, or a string, but number given");

    err(function(){
      expect(null).to.include(42);
    }, "object tested must be an array, an object, or a string, but null given");

    err(function(){
      expect(undefined).to.include(42);
    }, "object tested must be an array, an object, or a string, but undefined given");

    err(function(){
      expect(true).to.not.include(true);
    }, "object tested must be an array, an object, or a string, but boolean given");

    err(function(){
      expect(42.0).to.not.include(42);
    }, "object tested must be an array, an object, or a string, but number given");

    err(function(){
      expect(null).to.not.include(42);
    }, "object tested must be an array, an object, or a string, but null given");

    err(function(){
      expect(undefined).to.not.include(42);
    }, "object tested must be an array, an object, or a string, but undefined given");
  });

  it('keys(array|Object|arguments)', function(){
    expect({ foo: 1 }).to.have.keys(['foo']);
    expect({ foo: 1 }).have.keys({ 'foo': 6 });
    expect({ foo: 1, bar: 2 }).to.have.keys(['foo', 'bar']);
    expect({ foo: 1, bar: 2 }).to.have.keys('foo', 'bar');
    expect({ foo: 1, bar: 2 }).have.keys({ 'foo': 6, 'bar': 7 });
    expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('foo', 'bar');
    expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('bar', 'foo');
    expect({ foo: 1, bar: 2, baz: 3 }).to.contain.keys('baz');
    expect({ foo: 1, bar: 2 }).contain.keys({ 'foo': 6 });
    expect({ foo: 1, bar: 2 }).contain.keys({ 'bar': 7 });
    expect({ foo: 1, bar: 2 }).contain.keys({ 'foo': 6 });

    expect({ foo: 1, bar: 2 }).to.contain.keys('foo');
    expect({ foo: 1, bar: 2 }).to.contain.keys('bar', 'foo');
    expect({ foo: 1, bar: 2 }).to.contain.keys(['foo']);
    expect({ foo: 1, bar: 2 }).to.contain.keys(['bar']);
    expect({ foo: 1, bar: 2 }).to.contain.keys(['bar', 'foo']);
    expect({ foo: 1, bar: 2, baz: 3 }).to.contain.all.keys(['bar', 'foo']);

    expect({ foo: 1, bar: 2 }).to.not.have.keys('baz');
    expect({ foo: 1, bar: 2 }).to.not.have.keys('foo', 'baz');
    expect({ foo: 1, bar: 2 }).to.not.contain.keys('baz');
    expect({ foo: 1, bar: 2 }).to.not.contain.keys('foo', 'baz');
    expect({ foo: 1, bar: 2 }).to.not.contain.keys('baz', 'foo');

    /* INCOMPATIBLITY
    expect({ foo: 1, bar: 2 }).to.have.any.keys('foo', 'baz');
    expect({ foo: 1, bar: 2 }).to.have.any.keys('foo');
    expect({ foo: 1, bar: 2 }).to.contain.any.keys('bar', 'baz');
    expect({ foo: 1, bar: 2 }).to.contain.any.keys(['foo']);
    */
    expect({ foo: 1, bar: 2 }).to.have.all.keys(['bar', 'foo']);
    expect({ foo: 1, bar: 2 }).to.contain.all.keys(['bar', 'foo']);
    /* INCOMPATIBLITY
    expect({ foo: 1, bar: 2 }).contain.any.keys({ 'foo': 6 });
    */
    expect({ foo: 1, bar: 2 }).have.all.keys({ 'foo': 6, 'bar': 7 });
    expect({ foo: 1, bar: 2 }).contain.all.keys({ 'bar': 7, 'foo': 6 });

    /* INCOMPATIBLITY
    expect({ foo: 1, bar: 2 }).to.not.have.any.keys('baz', 'abc', 'def');
    expect({ foo: 1, bar: 2 }).to.not.have.any.keys('baz');
    expect({ foo: 1, bar: 2 }).to.not.contain.any.keys('baz');
    */
    expect({ foo: 1, bar: 2 }).to.not.have.all.keys(['baz', 'foo']);
    expect({ foo: 1, bar: 2 }).to.not.contain.all.keys(['baz', 'foo']);
    expect({ foo: 1, bar: 2 }).not.have.all.keys({ 'baz': 8, 'foo': 7 });
    expect({ foo: 1, bar: 2 }).not.contain.all.keys({ 'baz': 8, 'foo': 7 });

    err(function(){
      expect({ foo: 1 }).to.have.keys();
    }, "keys required");

    err(function(){
      expect({ foo: 1 }).to.have.keys([]);
    }, "keys required");

    err(function(){
      expect({ foo: 1 }).to.not.have.keys([]);
    }, "keys required");

    err(function(){
      expect({ foo: 1 }).to.contain.keys([]);
    }, "keys required");

    var mixedArgsMsg = 'keys must be given single argument of Array|Object|String, or multiple String arguments'

    err(function(){
      expect({}).contain.keys(['a'], "b");
    }, mixedArgsMsg);

    err(function(){
      expect({}).contain.keys({ 'a': 1 }, "b");
    }, mixedArgsMsg);

    err(function(){
      expect({ foo: 1 }).to.have.keys(['bar']);
    }, "expected { foo: 1 } to have keys [ 'bar' ]"); // "expected { foo: 1 } to have key 'bar'"

    err(function(){
      expect({ foo: 1 }).to.have.keys(['bar', 'baz']);
    }, "expected { foo: 1 } to have keys [ 'bar', 'baz' ]"); // "expected { foo: 1 } to have keys 'bar', and 'baz'"

    err(function(){
      expect({ foo: 1 }).to.have.keys(['foo', 'bar', 'baz']);
    }, "expected { foo: 1 } to have keys [ 'foo', 'bar', 'baz' ]"); // "expected { foo: 1 } to have keys 'foo', 'bar', and 'baz'"

    err(function(){
      expect({ foo: 1 }).to.not.have.keys(['foo']);
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not have key 'foo'"

    err(function(){
      expect({ foo: 1 }).to.not.have.keys(['foo']);
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not have key 'foo'"

    err(function(){
      expect({ foo: 1, bar: 2 }).to.not.have.keys(['foo', 'bar']);
    }, "expected { foo: 1, bar: 2 } not to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'"

    /* INCOMPATIBLITY
    err(function(){
      expect({ foo: 1, bar: 2 }).to.have.all.keys('foo');
    }, "expected { foo: 1, bar: 2 } to have key 'foo'");
    */

    err(function(){
      expect({ foo: 1 }).to.not.contain.keys(['foo']);
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not contain key 'foo'"

    err(function(){
      expect({ foo: 1 }).to.contain.keys('foo', 'bar');
    }, "expected { foo: 1 } to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1 } to contain keys 'foo', and 'bar'"

    /* INCOMPATIBLITY
    err(function() {
      expect({ foo: 1 }).to.have.any.keys('baz');
    }, "expected { foo: 1 } to have key 'baz'");
    */

    err(function(){
      expect({ foo: 1, bar: 2 }).to.not.have.all.keys(['foo', 'bar']);
    }, "expected { foo: 1, bar: 2 } not to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'"

    /* INCOMPATIBLITY
    err(function(){
      expect({ foo: 1, bar: 2 }).to.not.have.any.keys(['foo', 'baz']);
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', or 'baz'");
    */

    // repeat previous tests with Object as arg.
    err(function(){
      expect({ foo: 1 }).have.keys({ 'bar': 1 });
    }, "expected { foo: 1 } to have keys [ 'bar' ]"); // "expected { foo: 1 } to have key 'bar'"

    err(function(){
      expect({ foo: 1 }).have.keys({ 'bar': 1, 'baz': 1});
    }, "expected { foo: 1 } to have keys [ 'bar', 'baz' ]"); // "expected { foo: 1 } to have keys 'bar', and 'baz'"

    err(function(){
      expect({ foo: 1 }).have.keys({ 'foo': 1, 'bar': 1, 'baz': 1});
    }, "expected { foo: 1 } to have keys [ 'foo', 'bar', 'baz' ]"); // "expected { foo: 1 } to have keys 'foo', 'bar', and 'baz'"

    err(function(){
      expect({ foo: 1 }).not.have.keys({ 'foo': 1 });
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not have key 'foo'"

    err(function(){
      expect({ foo: 1 }).not.have.keys({ 'foo': 1 });
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not have key 'foo'"

    err(function(){
      expect({ foo: 1, bar: 2 }).not.have.keys({ 'foo': 1, 'bar': 1});
    }, "expected { foo: 1, bar: 2 } not to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'"

    err(function(){
      expect({ foo: 1 }).not.contain.keys({ 'foo': 1 });
    }, "expected { foo: 1 } not to have keys [ 'foo' ]"); // "expected { foo: 1 } to not contain key 'foo'"

    err(function(){
      expect({ foo: 1 }).contain.keys('foo', 'bar');
    }, "expected { foo: 1 } to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1 } to contain keys 'foo', and 'bar'"

    /* INCOMPATIBLITY
    err(function() {
      expect({ foo: 1 }).have.any.keys('baz');
    }, "expected { foo: 1 } to have key 'baz'");
    */

    err(function(){
      expect({ foo: 1, bar: 2 }).not.have.all.keys({ 'foo': 1, 'bar': 1});
    }, "expected { foo: 1, bar: 2 } not to have keys [ 'foo', 'bar' ]"); // "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'"

    /* INCOMPATIBLITY
    err(function(){
      expect({ foo: 1, bar: 2 }).not.have.any.keys({ 'foo': 1, 'baz': 1});
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', or 'baz'");
    */
  });

  it('keys(array) will not mutate array (#359)', function () {
      var expected = [ 'b', 'a' ];
      var original_order = [ 'b', 'a' ];
      var obj = { "b": 1, "a": 1 };
      expect(expected).deep.equal(original_order);
      expect(obj).keys(original_order);
      expect(expected).deep.equal(original_order);
  });

  it('chaining', function(){
    var tea = { name: 'chai', extras: ['milk', 'sugar', 'smile'] };
    expect(tea).to.have.property('extras').with.lengthOf(3);

    expect(tea).to.have.property('extras').which.contains('smile');

    err(function(){
      expect(tea).to.have.property('extras').with.lengthOf(4);
    }, /^expected \[ 'milk', 'sugar', 'smile' \] to have length 4/); // TODO: used to be: "expected [ 'milk', 'sugar', 'smile' ] to have a length of 4 but got 3"

    expect(tea).to.be.a('object').and.have.property('name', 'chai');

    var badFn = function () { throw new Error('testing'); };

    expect(badFn).to.throw(Error).with.property('message', 'testing'); // TODO: used to be 'testing'
  });

  it('throw', function () {
    // See GH-45: some poorly-constructed custom errors don't have useful names
    // on either their constructor or their constructor prototype, but instead
    // only set the name inside the constructor itself.
    var PoorlyConstructedError = function () {
      this.name = 'PoorlyConstructedError';
    };
    PoorlyConstructedError.prototype = Object.create(Error.prototype);

    function CustomError(message) {
        this.name = 'CustomError';
        this.message = message;
    }
    CustomError.prototype = Error.prototype;

    var specificError = new RangeError('boo');

    var goodFn = function () { 1==1; }
      , badFn = function () { throw new Error('testing'); }
      , refErrFn = function () { throw new ReferenceError('hello'); }
      , ickyErrFn = function () { throw new PoorlyConstructedError(); }
      , specificErrFn = function () { throw specificError; }
      , customErrFn = function() { throw new CustomError('foo'); };

    expect(goodFn).to.not.throw();
    expect(goodFn).to.not.throw(Error);
    expect(goodFn).to.not.throw(specificError);
    expect(badFn).to.throw();
    expect(badFn).to.throw(Error);
    expect(badFn).to.not.throw(ReferenceError);
    expect(badFn).to.not.throw(specificError);
    expect(refErrFn).to.throw();
    expect(refErrFn).to.throw(ReferenceError);
    expect(refErrFn).to.throw(Error);
    expect(refErrFn).to.not.throw(TypeError);
    expect(refErrFn).to.not.throw(specificError);
    expect(ickyErrFn).to.throw();
    expect(ickyErrFn).to.throw(PoorlyConstructedError);
    expect(ickyErrFn).to.throw(Error);
    expect(ickyErrFn).to.not.throw(specificError);
    expect(specificErrFn).to.throw(specificError);

    expect(badFn).to.throw(/testing/);
    expect(badFn).to.not.throw(/hello/);
    expect(badFn).to.throw('testing');
    expect(badFn).to.not.throw('hello');

    expect(badFn).to.throw(Error, /testing/);
    expect(badFn).to.throw(Error, 'testing');

    errIgnoringMessage(function(){
      expect(goodFn).to.throw();
    }, "expected [Function] to throw an error");

    errIgnoringMessage(function(){
      expect(goodFn).to.throw(ReferenceError);
    }, "expected [Function] to throw ReferenceError");

    errIgnoringMessage(function(){
      expect(goodFn).to.throw(specificError);
    }, "expected [Function] to throw 'RangeError: boo'");

    errIgnoringMessage(function(){
      expect(badFn).to.not.throw();
    }, "expected [Function] to not throw an error but 'Error: testing' was thrown");

    errIgnoringMessage(function(){
      expect(badFn).to.throw(ReferenceError);
    }, "expected [Function] to throw 'ReferenceError' but 'Error: testing' was thrown");

    errIgnoringMessage(function(){
      expect(badFn).to.throw(specificError);
    }, "expected [Function] to throw 'RangeError: boo' but 'Error: testing' was thrown");

    errIgnoringMessage(function(){
      expect(badFn).to.not.throw(Error);
    }, "expected [Function] to not throw 'Error' but 'Error: testing' was thrown");

    errIgnoringMessage(function(){
      expect(refErrFn).to.not.throw(ReferenceError);
    }, "expected [Function] to not throw 'ReferenceError' but 'ReferenceError: hello' was thrown");

    errIgnoringMessage(function(){
      expect(badFn).to.throw(PoorlyConstructedError);
    }, "expected [Function] to throw 'PoorlyConstructedError' but 'Error: testing' was thrown");

    errIgnoringMessage(function(){
      expect(ickyErrFn).to.not.throw(PoorlyConstructedError);
    }, /^(expected \[Function\] to not throw 'PoorlyConstructedError' but)(.*)(PoorlyConstructedError|\{ Object \()(.*)(was thrown)$/);

    errIgnoringMessage(function(){
      expect(ickyErrFn).to.throw(ReferenceError);
    }, /^(expected \[Function\] to throw 'ReferenceError' but)(.*)(PoorlyConstructedError|\{ Object \()(.*)(was thrown)$/);

    errIgnoringMessage(function(){
      expect(specificErrFn).to.throw(new ReferenceError('eek'));
    }, "expected [Function] to throw 'ReferenceError: eek' but 'RangeError: boo' was thrown");

    errIgnoringMessage(function(){
      expect(specificErrFn).to.not.throw(specificError);
    }, "expected [Function] to not throw 'RangeError: boo'");

    errIgnoringMessage(function (){
      expect(badFn).to.not.throw(/testing/);
    }, "expected [Function] to throw error not matching /testing/");

    errIgnoringMessage(function () {
      expect(badFn).to.throw(/hello/);
    }, "expected [Function] to throw error matching /hello/ but got 'testing'");

    errIgnoringMessage(function () {
      expect(badFn).to.throw(Error, /hello/, 'blah');
    }, "blah: expected [Function] to throw error matching /hello/ but got 'testing'");

    errIgnoringMessage(function () {
      expect(badFn).to.throw(Error, 'hello', 'blah');
    }, "blah: expected [Function] to throw error including 'hello' but got 'testing'");

    errIgnoringMessage(function () {
      (customErrFn).should.not.throw();
    }, "expected [Function] to not throw an error but 'CustomError: foo' was thrown");
  });

  it.skip('respondTo', function(){
    function Foo(){};
    Foo.prototype.bar = function(){};
    Foo.func = function() {};

    var bar = {};
    bar.foo = function(){};

    expect(Foo).to.respondTo('bar');
    expect(Foo).to.not.respondTo('foo');
    expect(Foo).itself.to.respondTo('func');
    expect(Foo).itself.not.to.respondTo('bar');

    expect(bar).to.respondTo('foo');

    err(function(){
      expect(Foo).to.respondTo('baz', 'constructor');
    }, /^(constructor: expected)(.*)(\[Function: Foo\])(.*)(to respond to \'baz\')$/);

    err(function(){
      expect(bar).to.respondTo('baz', 'object');
    }, /^(object: expected)(.*)(\{ foo: \[Function\] \}|\{ Object \()(.*)(to respond to \'baz\')$/);
  });

  it('satisfy', function(){
    var matcher = function (num) {
      return num === 1;
    };

    expect(1).to.satisfy(matcher);

    err(function(){
      expect(2).to.satisfy(matcher, 'blah');
    }, 'blah: expected 2 to satisfy function (num) { return num === 1; }'); // "blah: expected 2 to satisfy [Function]"
  });

  it('closeTo', function(){
    expect(1.5).to.be.closeTo(1.0, 0.5);
    expect(10).to.be.closeTo(20, 20);
    expect(-10).to.be.closeTo(20, 30);

    err(function(){
      expect(2).to.be.closeTo(1.0, 0.5, 'blah');
    }, 'blah: expected 2 to be close to 1 (epsilon: 5e-1)'); // "blah: expected 2 to be close to 1 +/- 0.5"

    err(function(){
      expect(-10).to.be.closeTo(20, 29, 'blah');
    }, 'blah: expected -10 to be close to 20 (epsilon: 2.9e+1)'); // "blah: expected -10 to be close to 20 +/- 29"

    errIgnoringMessage(function() {
      expect([1.5]).to.be.closeTo(1.0, 0.5);
    }, "expected [ 1.5 ] to be a number");

    errIgnoringMessage(function() {
      expect(1.5).to.be.closeTo("1.0", 0.5);
    }, "the arguments to closeTo or approximately must be numbers");

    errIgnoringMessage(function() {
      expect(1.5).to.be.closeTo(1.0, true);
    }, "the arguments to closeTo or approximately must be numbers");
  });

  it('approximately', function(){
    expect(1.5).to.be.approximately(1.0, 0.5);
    expect(10).to.be.approximately(20, 20);
    expect(-10).to.be.approximately(20, 30);

    err(function(){
      expect(2).to.be.approximately(1.0, 0.5, 'blah');
    }, 'blah: expected 2 to be close to 1 (epsilon: 5e-1)'); // "blah: expected 2 to be close to 1 +/- 0.5"

    err(function(){
      expect(-10).to.be.approximately(20, 29, 'blah');
    }, 'blah: expected -10 to be close to 20 (epsilon: 2.9e+1)'); // "blah: expected -10 to be close to 20 +/- 29"

    errIgnoringMessage(function() {
      expect([1.5]).to.be.approximately(1.0, 0.5);
    }, "expected [ 1.5 ] to be a number");

    errIgnoringMessage(function() {
      expect(1.5).to.be.approximately("1.0", 0.5);
    }, "the arguments to closeTo or approximately must be numbers");

    errIgnoringMessage(function() {
      expect(1.5).to.be.approximately(1.0, true);
    }, "the arguments to closeTo or approximately must be numbers");
  });

  it('oneOf', function() {
    expect(1).to.be.oneOf([1, 2, 3]);
    expect('1').to.not.be.oneOf([1, 2, 3]);
    expect([3, [4]]).to.not.be.oneOf([1, 2, [3, 4]]);
    var threeFour = [3, [4]];
    expect(threeFour).to.be.oneOf([1, 2, threeFour]);
  });

  it('include.members', function() {
    expect([1, 2, 3]).to.include.members([]);
    expect([1, 2, 3]).to.include.members([3, 2]);
    expect([1, 2, 3]).to.not.include.members([8, 4]);
    expect([1, 2, 3]).to.not.include.members([1, 2, 3, 4]);
  });

  it('same.members', function() {
    expect([5, 4]).to.have.same.members([4, 5]);
    expect([5, 4]).to.have.same.members([5, 4]);
    expect([5, 4]).to.not.have.same.members([]);
    expect([5, 4]).to.not.have.same.members([6, 3]);
    expect([5, 4]).to.not.have.same.members([5, 4, 2]);
  });

  it('members', function() {
    expect([5, 4]).members([4, 5]);
    expect([5, 4]).members([5, 4]);
    expect([5, 4]).not.members([]);
    expect([5, 4]).not.members([6, 3]);
    expect([5, 4]).not.members([5, 4, 2]);
    expect([{ id: 1 }]).not.members([{ id: 1 }]);
  });

  it('deep.members', function() {
    expect([{ id: 1 }]).deep.members([{ id: 1 }]);
    expect([{ id: 2 }]).not.deep.members([{ id: 1 }]);
    err(function(){
      expect([{ id: 1 }]).deep.members([{ id: 2 }])
    }, 'expected [ { id: 1 } ] to include deep members [ { id: 2 } ]'); // "expected [ { id: 1 } ] to have the same members as [ { id: 2 } ]"
  });

  it.skip('change', function() {
    var obj = { value: 10, str: 'foo' },
        fn     = function() { obj.value += 5 },
        sameFn = function() { 'foo' + 'bar' },
        bangFn = function() { obj.str += '!' };

    expect(fn).to.change(obj, 'value');
    expect(sameFn).to.not.change(obj, 'value');
    expect(sameFn).to.not.change(obj, 'str');
    expect(bangFn).to.change(obj, 'str');
  });

  it('increase, decrease', function() {
    var obj = { value: 10 },
        incFn = function() { obj.value += 2 },
        decFn = function() { obj.value -= 3 },
        smFn  = function() { obj.value += 0 };

    expect(smFn).to.not.increase(obj, 'value');
    expect(decFn).to.not.increase(obj, 'value');
    expect(incFn).to.increase(obj, 'value');

    expect(smFn).to.not.decrease(obj, 'value');
    expect(incFn).to.not.decrease(obj, 'value');
    expect(decFn).to.decrease(obj, 'value');
  });

  it('extensible', function() {
    var nonExtensibleObject = Object.preventExtensions({});

    expect({}).to.be.extensible;
    expect(nonExtensibleObject).to.not.be.extensible;

    err(function() {
        expect(nonExtensibleObject).to.be.extensible;
    }, 'expected {} to be extensible');

    err(function() {
        expect({}).to.not.be.extensible;
    }, 'expected {} to not be extensible');

    // Making sure ES6-like Object.isExtensible response is respected for all primitive types

    expect(42).to.not.be.extensible;
    expect(null).to.not.be.extensible;
    expect('foo').to.not.be.extensible;
    expect(false).to.not.be.extensible;
    expect(undefined).to.not.be.extensible;

    err(function() {
      expect(42).to.be.extensible;
    }, 'expected 42 to be extensible');

    err(function() {
      expect(null).to.be.extensible;
    }, 'expected null to be extensible');

    err(function() {
      expect('foo').to.be.extensible;
    }, 'expected \'foo\' to be extensible');

    err(function() {
      expect(false).to.be.extensible;
    }, 'expected false to be extensible');

    err(function() {
      expect(undefined).to.be.extensible;
    }, 'expected undefined to be extensible');
  });

  it('sealed', function() {
    var sealedObject = Object.seal({});

    expect(sealedObject).to.be.sealed;
    expect({}).to.not.be.sealed;

    err(function() {
        expect({}).to.be.sealed;
    }, 'expected {} to be sealed');

    err(function() {
        expect(sealedObject).to.not.be.sealed;
    }, 'expected {} to not be sealed');

    // Making sure ES6-like Object.isSealed response is respected for all primitive types

    expect(42).to.be.sealed;
    expect(null).to.be.sealed;
    expect('foo').to.be.sealed;
    expect(false).to.be.sealed;
    expect(undefined).to.be.sealed;

    err(function() {
      expect(42).to.not.be.sealed;
    }, 'expected 42 to not be sealed');

    err(function() {
      expect(null).to.not.be.sealed;
    }, 'expected null to not be sealed');

    err(function() {
      expect('foo').to.not.be.sealed;
    }, 'expected \'foo\' to not be sealed');

    err(function() {
      expect(false).to.not.be.sealed;
    }, 'expected false to not be sealed');

    err(function() {
      expect(undefined).to.not.be.sealed;
    }, 'expected undefined to not be sealed');
  });

  it('frozen', function() {
    var frozenObject = Object.freeze({});

    expect(frozenObject).to.be.frozen;
    expect({}).to.not.be.frozen;

    err(function() {
        expect({}).to.be.frozen;
    }, 'expected {} to be frozen');

    err(function() {
        expect(frozenObject).to.not.be.frozen;
    }, 'expected {} to not be frozen');

    // Making sure ES6-like Object.isFrozen response is respected for all primitive types

    expect(42).to.be.frozen;
    expect(null).to.be.frozen;
    expect('foo').to.be.frozen;
    expect(false).to.be.frozen;
    expect(undefined).to.be.frozen;

    err(function() {
      expect(42).to.not.be.frozen;
    }, 'expected 42 to not be frozen');

    err(function() {
      expect(null).to.not.be.frozen;
    }, 'expected null to not be frozen');

    err(function() {
      expect('foo').to.not.be.frozen;
    }, 'expected \'foo\' to not be frozen');

    err(function() {
      expect(false).to.not.be.frozen;
    }, 'expected false to not be frozen');

    err(function() {
      expect(undefined).to.not.be.frozen;
    }, 'expected undefined to not be frozen');
  });
});
