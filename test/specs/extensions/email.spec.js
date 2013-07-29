'use strict';

describe('Hoodie.Email', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    this.email = new Hoodie.Email(this.hoodie);

    this.errorSpy = sinon.spy();
    this.successSpy = sinon.spy();
  });

  describe('hoodie.email(emailAttributes)', function() {

  });

});

