require('../../lib/setup');

// var generateIdMock = require('../../mocks/utils/generate_id')();
// var configMock = require('../../mocks/utils/config');
// var getDefer = require('../../../src/utils/promise/defer');

// var hoodieAccount = require('../../../src/hoodie/account');
// var extend = require('extend');

var utils = require('../../../src/utils');
var hoodieAccount = require('../../../src/hoodie/account');
var accountApi = require('../../../src/hoodie/account/api');

describe('hoodie.account setup', function() {
  beforeEach(function() {
    var accountEventBindings = this.accountEventBindings = {};
    var hoodieEventBindings = this.hoodieEventBindings = {};

    this.hoodie = {
      on: function(event, handler) {
        hoodieEventBindings[event] = handler;
      }
    };

    this.sandbox.stub(accountApi, 'checkPasswordReset');
    this.sandbox.stub(utils.config, 'get').returnsArg(0);

    this.sandbox.stub(utils, 'events', function(hoodie, account) {
      account.on = function(event, handler) {
        accountEventBindings[event] = handler;
      };
    });

    hoodieAccount(this.hoodie);
  });
  it('sets hoodie.account', function() {
    expect(this.hoodie.account).to.be.an(Object);
  });
  it('checks for password reset', function() {
    expect(accountApi.checkPasswordReset).to.be.called();
  });
  it('inits username', function() {
    expect(utils.config.get).to.be.calledWith('_account.username');
    expect(this.hoodie.account.username).to.be('_account.username');
  });
  it('inits bearer token', function() {
    expect(utils.config.get).to.be.calledWith('_account.bearerToken');
  });
  it('clears config on cleanup event', function() {
    expect(this.accountEventBindings.cleanup).to.be(utils.config.clear);
  });
  it('reauthenticate on remote:unauthenticated event', function() {
    expect(this.hoodieEventBindings['remote:error:unauthenticated']).to.be.a(Function);
  });
});


describe('hoodie.account.signUp', function() {
  // TODO: write specs
});
describe('hoodie.account.anonymousSignUp', function() {
  // TODO: write specs
});
describe('hoodie.account.signIn', function() {
  // TODO: write specs
});
describe('hoodie.account.signOut', function() {
  // TODO: write specs
});
describe('hoodie.account.changePassword', function() {
  // TODO: write specs
});
describe('hoodie.account.resetPassword', function() {
  // TODO: write specs
});
describe('hoodie.account.checkPasswordReset', function() {
  // TODO: write specs
});
describe('hoodie.account.changeUsername', function() {
  // TODO: write specs
});
describe('hoodie.account.destroy', function() {
  // TODO: write specs
});
