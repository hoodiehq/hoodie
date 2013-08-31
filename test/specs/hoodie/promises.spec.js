/* global hoodiePromises:true */

describe('hoodie promises API', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    hoodiePromises(this.hoodie);
  });


  describe('#isPromise(object)', function() {

    it('should return true if object is a promise', function() {
      var object = $.Deferred().promise();
      expect(this.hoodie.isPromise(object)).to.be.ok();
    });

    it('should return false for deferred objects', function() {
      var object = $.Deferred();
      expect(this.hoodie.isPromise(object)).to.not.be.ok();
    });

    it('should return false when object is undefined', function() {
      expect(this.hoodie.isPromise(void 0)).to.not.be.ok();
    });

  });

  describe('#resolve()', function() {

    it('simply returns resolved promise', function() {
      expect(this.hoodie.resolve().state()).to.eql('resolved');
    });

    it('should be applyable', function() {
      var promise = this.hoodie.reject().then(null, this.hoodie.resolve);
      expect(promise.state()).to.eql('resolved');
    });

  });

  describe('#reject()', function() {

    it('simply returns rejected promise', function() {
      expect(this.hoodie.reject().state()).to.eql('rejected');
    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolve().then(this.hoodie.reject);
      expect(promise.state()).to.eql('rejected');
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
      var promise = this.hoodie.rejectWith(1, 2).then(null, this.hoodie.resolveWith);
      promise.then(function (a, b) {
        expect(a, b).to.eql('1', '2');
      });
    });

  });

  describe('#rejectWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = this.hoodie.rejectWith('funky', 'fresh');

      promise.then(this.noop, function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolveWith(1, 2).then(this.hoodie.rejectWith);
      promise.then(this.noop, function (a, b) {
        expect(a, b).to.eql('1', '2');
      });
    });

  });

});
