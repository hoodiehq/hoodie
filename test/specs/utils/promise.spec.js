require('../../lib/setup');

var promise = require('../../../src/utils/promise/');

describe('hoodie promises API', function() {

  describe('#isPromise(object)', function() {

    it('should return true if object is a promise', function() {
      var object = $.Deferred().promise();
      expect(promise.isPromise(object)).to.be(true);
    });

    it('should return false for deferred objects', function() {
      var object = $.Deferred();
      expect(promise.isPromise(object)).to.be(false);
    });

    it('should return false when object is undefined', function() {
      expect(promise.isPromise(void 0)).to.be(false);
    });

  });

  describe('#resolve()', function() {

    it('simply returns resolved promise', function() {
      expect(promise.resolve().state()).to.be('resolved');
    });

    it('should be applyable', function() {
      var promise = promise.reject().then(null, promise.resolve);
      expect(promise).to.be.resolved();
    });

  });

  describe('#reject()', function() {

    it('simply returns rejected promise', function() {
      expect(promise.reject()).to.be.rejected();
    });

    it('should be applyable', function() {
      var promise = promise.resolve().then(promise.reject);
      expect(promise).to.be.rejected();
    });

  });

  describe('#resolveWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = promise.resolveWith('funky', 'fresh');

      promise.then(function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = promise.rejectWith('FUNKY!').then(null, promise.resolveWith);
      promise.then(function (error) {
        expect(error.message).to.eql('FUNKY!');
      });
    });

  });

  describe('#rejectWith(something)', function() {

    it('wraps passed arguments into a promise and returns it as Error', function() {
      var promise = promise.rejectWith('funk overflow!');

      promise.then(this.noop, function (error) {
        expect(error).to.be.an(Error);
        expect(error).to.eql({
          name: 'HoodieError',
          message: 'funk overflow!'
        });
      });

    });

    it('should be applyable', function() {
      var promise = promise.resolveWith('wicked!').then(promise.rejectWith);
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
