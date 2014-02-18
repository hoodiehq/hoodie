require('../../lib/setup');

var isPromise = require('../../../src/utils/promise/is_promise');
var resolve = require('../../../src/utils/promise/resolve');
var reject = require('../../../src/utils/promise/reject');
var resolveWith = require('../../../src/utils/promise/resolve_with');
var rejectWith = require('../../../src/utils/promise/reject_with');

describe('hoodie promises API', function() {

  describe('#isPromise(object)', function() {

    it('should return true if object is a promise', function() {
      var object = $.Deferred().promise();
      expect(isPromise(object)).to.be(true);
    });

    it('should return false for deferred objects', function() {
      var object = $.Deferred();
      expect(isPromise(object)).to.be(false);
    });

    it('should return false when object is undefined', function() {
      expect(isPromise(void 0)).to.be(false);
    });

  });

  describe('#resolve()', function() {

    it('simply returns resolved promise', function() {
      expect(resolve().state()).to.be('resolved');
    });

    it('should be applyable', function() {
      var promise = reject().then(null, resolve);
      expect(promise).to.be.resolved();
    });

  });

  describe('#reject()', function() {

    it('simply returns rejected promise', function() {
      expect(reject()).to.be.rejected();
    });

    it('should be applyable', function() {
      var promise = resolve().then(reject);
      expect(promise).to.be.rejected();
    });

  });

  describe('#resolveWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = resolveWith('funky', 'fresh');

      promise.then(function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = rejectWith('FUNKY!').then(null, resolveWith);
      promise.then(function (error) {
        expect(error.message).to.eql('FUNKY!');
      });
    });

  });

  describe('#rejectWith(something)', function() {

    it('wraps passad arguments into a promise and returns it as Error', function() {
      var promise = rejectWith('funk overflow!');

      promise.then(this.noop, function (error) {
        expect(error).to.be.an(Error);
        expect(error).to.eql({
          name: 'HoodieError',
          message: 'funk overflow!'
        });
      });

    });

    it('should be applyable', function() {
      var promise = resolveWith('wicked!').then(rejectWith);
      promise.then(this.noop, function (error) {
        expect(error).to.be.an(Error);
        expect(error.name).to.eql('HoodieError');
        expect(error).to.eql({
          name: 'HoodieError',
          message: 'wicked!'
        });
      });
    });

  });

});
