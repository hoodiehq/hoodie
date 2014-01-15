require('../../lib/setup');
var hoodiePromises = require('../../../src/utils/promises');

describe('hoodie promises API', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    hoodiePromises(this.hoodie);
  });


  describe('#isPromise(object)', function() {

    it('should return true if object is a promise', function() {
      var object = $.Deferred().promise();
      expect(this.hoodie.isPromise(object)).to.be(true);
    });

    it('should return false for deferred objects', function() {
      var object = $.Deferred();
      expect(this.hoodie.isPromise(object)).to.be(false);
    });

    it('should return false when object is undefined', function() {
      expect(this.hoodie.isPromise(void 0)).to.be(false);
    });

  });

  describe('#resolve()', function() {

    it('simply returns resolved promise', function() {
      expect(this.hoodie.resolve().state()).to.be('resolved');
    });

    it('should be applyable', function() {
      var promise = this.hoodie.reject().then(null, this.hoodie.resolve);
      expect(promise).to.be.resolved();
    });

  });

  describe('#reject()', function() {

    it('simply returns rejected promise', function() {
      expect(this.hoodie.reject()).to.be.rejected();
    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolve().then(this.hoodie.reject);
      expect(promise).to.be.rejected();
    });

  });

  describe('#resolveWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = this.hoodie.resolveWith('funky', 'fresh');

      promise.then(function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = this.hoodie.rejectWith('FUNKY!').then(null, this.hoodie.resolveWith);
      promise.then(function (error) {
        expect(error.message).to.eql('FUNKY!');
      });
    });

  });

  describe('#rejectWith(something)', function() {

    it('wraps passad arguments into a promise and returns it as Error', function() {
      var promise = this.hoodie.rejectWith('funk overflow!');

      promise.then(this.noop, function (error) {
        expect(error).to.be.an(Error);
        expect(error).to.eql({
          name: 'HoodieError',
          message: 'funk overflow!'
        });
      });

    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolveWith('wicked!').then(this.hoodie.rejectWith);
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
