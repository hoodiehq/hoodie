// ## ref success
// {
//   to: "jin@beam.org",
//   subject: "Tolle Liste",
//   body: "...",
//   deliveredAt: "2012-05-05 15:00 UTC"
// }

// ## ref error
// {
//   to: "jin@beam.org",
//   subject: "Tolle Liste",
//   body: "...",
//   error: "No such recipient"
// }
//

describe("Hoodie.Email", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    this.email = new Hoodie.Email(this.hoodie);
    this.errorSpy = jasmine.createSpy('error');
    return this.successSpy = jasmine.createSpy('success');
  });
  return describe(".send(emailAttributes)", function() {
    beforeEach(function() {
      this.emailAttributes = {
        to: 'jim@be.am',
        subject: 'subject',
        body: 'body'
      };
      return (spyOn(this.hoodie.store, "add")).andReturn({
        then: function(cb) {
          return cb($.extend({}, this.emailAttributes, {
            id: 'abc4567'
          }));
        }
      });
    });
    it("should reject the promise", function() {
      return expect(this.email.send(this.emailAttributes)).toBePromise();
    });
    it("should save the email as object with type: $email", function() {
      this.email.send(this.emailAttributes);
      return (expect(this.hoodie.store.add)).wasCalledWith('$email', this.emailAttributes);
    });
    it("should listen to server response", function() {
      spyOn(this.hoodie.remote, "one");
      this.email.send(this.emailAttributes);
      expect(this.hoodie.remote.one).wasCalled();
      return expect(this.hoodie.remote.one.mostRecentCall.args[0]).toEqual("updated:$email:abc4567");
    });
    _when("email.to is not provided", function() {
      beforeEach(function() {
        return this.emailAttributes.to = '';
      });
      return it("should reject the promise", function() {
        var promise;
        promise = this.email.send(this.emailAttributes);
        promise.fail(this.errorSpy);
        return (expect(this.errorSpy)).wasCalledWith($.extend(this.emailAttributes, {
          error: 'Invalid email address (empty)'
        }));
      });
    });
    _when("email.to is 'invalid'", function() {
      beforeEach(function() {
        return this.emailAttributes.to = 'invalid';
      });
      return it("should reject the promise", function() {
        var promise;
        promise = this.email.send(this.emailAttributes);
        promise.fail(this.errorSpy);
        return (expect(this.errorSpy)).wasCalledWith($.extend(this.emailAttributes, {
          error: 'Invalid email address (invalid)'
        }));
      });
    });
    _when("sending email was successful", function() {
      beforeEach(function() {
        var _this = this;
        this.emailResponseAttributes = $.extend({}, this.emailAttributes, {
          id: 'abc4567',
          deliveredAt: "2012-05-05 15:00 UTC"
        });
        (spyOn(this.hoodie.remote, "one")).andCallFake(function(event, cb) {
          return cb(_this.emailResponseAttributes);
        });
        return this.promise = this.email.send(this.emailAttributes);
      });
      return it("should resolve the promise", function() {
        this.promise.done(this.successSpy);
        return (expect(this.successSpy)).wasCalledWith(this.emailResponseAttributes);
      });
    });
    return _when("sending email had an error", function() {
      beforeEach(function() {
        var _this = this;
        this.emailResponseAttributes = $.extend({}, this.emailAttributes, {
          id: 'abc4567',
          error: "U SPAM!"
        });
        (spyOn(this.hoodie.remote, "one")).andCallFake(function(event, cb) {
          return cb(_this.emailResponseAttributes);
        });
        return this.promise = this.email.send(this.emailAttributes);
      });
      return it("should resolve the promise", function() {
        this.promise.fail(this.errorSpy);
        return (expect(this.errorSpy)).wasCalledWith(this.emailResponseAttributes);
      });
    });
  });
});

