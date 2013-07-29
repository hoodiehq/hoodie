'use strict';

describe('Hoodie.Account', function () {

  beforeEach(function () {
    localStorage.clear();

    this.sandbox = sinon.sandbox.create();
    this.noop = function () {};

    this.hoodie = new Mocks.Hoodie();
    this.requestDefer = this.hoodie.defer();

    this.sandbox.stub(this.hoodie, 'request').returns(this.requestDefer.promise());
    this.sandbox.spy(this.hoodie, 'trigger');
    this.sandbox.stub(window, 'setTimeout').returns(function (cb) {
      return cb();
    });

    this.account = new Hoodie.Account(this.hoodie);
    this.hoodie.request.reset();
    this.account._requests = {};
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function () {

    beforeEach(function () {
      this.sandbox.spy(Hoodie.Account.prototype, 'on');
    });

    _when('account.username is set', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns((function () {
          return 'joe@example.com';
        })());
      });

      it('should set @username', function () {
        var account = new Hoodie.Account(this.hoodie);
        expect(account.username).to.eql('joe@example.com');
      });

    });

    _when('account.ownerHash is set', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns((function () {
          return 'owner_hash123';
        })());
      });

      it('should set @ownerHash', function () {
        var account = new Hoodie.Account(this.hoodie);
        expect(account.ownerHash).to.eql('owner_hash123');
      });

    });

    _when('account.ownerHash isn\'t set', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns(false);
        this.sandbox.stub(this.hoodie, 'uuid').returns('new_generated_owner_hash');
        this.sandbox.spy(this.hoodie.config, 'set');
      });

      it('should set @ownerHash', function () {
        var account = new Hoodie.Account(this.hoodie);
        expect(account.ownerHash).to.eql('new_generated_owner_hash');
      });

      it('should set account.ownerHash', function () {
        var account = new Hoodie.Account(this.hoodie);
        expect(account.hoodie.config.set.calledWith('_account.ownerHash', 'new_generated_owner_hash')).to.be.ok();
      });

    });

    it('should authenticate on next tick', function () {
      var account = new Hoodie.Account(this.hoodie);
      expect(window.setTimeout.calledWith(account.authenticate)).to.be.ok();
    });

    it('should check for a pending password request', function () {
      this.sandbox.spy(Hoodie.Account.prototype, '_checkPasswordResetStatus');

      expect(Hoodie.Account.prototype._checkPasswordResetStatus.called).to.not.be.ok();
    });

  });

  describe('#authenticate()', function () {

    beforeEach(function () {
      window.setTimeout.returns(function () {});
      this.account = new Hoodie.Account(this.hoodie);
    });

    _when('account is already authenticated', function () {

      beforeEach(function () {
        this.account._authenticated = true;
        this.account.username = 'joe@example.com';
        this.promise = this.account.authenticate();
      });

      it('should return a promise', function () {
        expect(this.promise).to.have.property('done');
        expect(this.promise).to.not.have.property('resolve');
      });

      it('should resolve the promise', function () {
        this.promise.then(function (res) {
          expect(res).to.eql('joe@example.com');
        });
      });

    });

    _when('account is unauthenticated', function () {

      beforeEach(function () {
        this.account._authenticated = false;
        this.promise = this.account.authenticate();
      });

      it('should return a promise', function () {
        expect(this.promise).to.have.property('done');
        expect(this.promise).to.not.have.property('resolve');
      });

      it('should reject the promise', function (done) {
        this.promise.then(this.noop, function () {
          done();
        });
      });

    });

    _when('there is a pending singIn request', function () {

      beforeEach(function () {
        this.signInDefer = this.hoodie.defer();
        this.account._requests.signIn = this.signInDefer.promise();
      });

      it('it should be rejected when it is pending and then fails', function () {
        var promise = this.account.authenticate();
        this.signInDefer.reject('nope');

        promise.then(this.noop, function (val) {
          expect(val).to.eql('nope');
        });

      });

      it('it should be resolved when it is pending and then succeeds', function () {
        var promise = this.account.authenticate();
        this.signInDefer.resolve('funky');

        promise.then(function (val) {
          expect(val).to.eql('funky');
        });
      });
    });

    _when('there is a pending singOut request', function () {

      beforeEach(function () {
        this.signOutDefer = this.hoodie.defer();
        this.account._requests.signOut = this.signOutDefer.promise();
      });

      it('it should be rejected when it is pending and then fails', function () {
        var promise = this.account.authenticate();
        this.signOutDefer.reject('nope');

        promise.then(this.noop, function (val) {
          expect(val).to.eql('nope');
        });

      });

      it('it should be rejected anyway, even if the pending request succeeds', function () {
        var promise = this.account.authenticate();
        this.signOutDefer.resolve('funky');

        promise.then(this.noop, function (val) {
          expect(val).to.eql('funky');
        });

      });

    });

    _when('account.username is not yet set', function () {

      it('should send a sign out request, but not cleanup', function () {
        this.account.authenticate();
        expect(this.hoodie.request.calledWith('DELETE', '/_session')).to.be.ok();
      });

      _and('signOut succeeds', function () {

        beforeEach(function () {
          this.requestDefer.resolve();
        });

        it('should return a rejected promise', function () {
          expect(this.account.authenticate().state()).to.eql('rejected');
        });

      });

      _and('signOut fails', function () {

        beforeEach(function () {
          this.requestDefer.reject();
        });

        it('should return a rejected promise', function () {
          expect(this.account.authenticate().state()).to.eql('rejected');
        });

      });

    });

    _when('username is set not set', function () {

      beforeEach(function () {
        delete this.account.username;
        this.signOutDefer = this.hoodie.defer();
        this.account._requests.signOut = this.signOutDefer.promise();
        this.promise = this.account.authenticate();
      });

      _and('signOut succeeds', function () {

        beforeEach(function () {
          this.signOutDefer.resolve();
        });

        it('should return a rejected promise', function () {
          expect(this.promise.state()).to.eql('rejected');
        });

      });

      _and('signOut fails', function () {

        beforeEach(function () {
          this.signOutDefer.reject();
        });

        it('should return a rejected promise', function () {
          expect(this.promise.state()).to.eql('rejected');
        });

      });

    });

    _when('account has not been authenticated yet', function () {

      beforeEach(function () {
        this.account.username = 'joe@example.com';
        delete this.account._authenticated;
      });

      it('should return a promise', function () {
        expect(this.account.authenticate()).to.have.property('done');
        expect(this.account.authenticate()).to.not.have.property('resolve');
      });

      it('should send a GET /_session', function () {
        this.account.authenticate();

        var args = this.hoodie.request.args[0];

        expect(this.hoodie.request.called).to.be.ok();
        expect(args[0]).to.eql('GET');
        expect(args[1]).to.eql('/_session');
      });

      it('should not send multiple GET /_session requests', function () {
        this.account.authenticate();
        this.account.authenticate();

        expect(this.hoodie.request.calledOnce).to.be.ok();
      });

      _when('authentication request is successful and returns session info for joe@example.com', function () {

        beforeEach(function () {
          this.sandbox.spy(this.hoodie.config, 'set');
          this.response = {
            userCtx: {
              name: 'user/joe@example.com',
              roles: ['user_hash', 'confirmed']
            }
          };
          this.requestDefer.resolve(this.response);
          this.promise = this.account.authenticate();
        });

        it('should set account as authenticated', function () {
          expect(this.account._authenticated).to.be.ok();
        });

        it('should resolve the promise with \'joe@example.com\'', function () {
          this.promise.then(function (res) {
            expect(res).to.eql('joe@example.com');
          });
        });

        it('should set account.username', function () {
          expect(this.account.username).to.eql('joe@example.com');
        });

        it('should not set _account.username config', function () {
          expect(this.hoodie.config.set.calledWith('_account.username', 'joe@example.com')).to.not.be.ok();
        });

        it('should set account.ownerHash', function () {
          expect(this.account.ownerHash).to.eql('user_hash');
          expect(this.hoodie.config.set.calledWith('_account.ownerHash', 'user_hash')).to.be.ok();
        });
      });

      _when('authentication request is successful and returns `name: null`', function () {

        beforeEach(function () {
          this.requestDefer.resolve({
            userCtx: {
              name: null
            }
          });
        });

        _and('the user signed up', function () {

          beforeEach(function () {
            this.account.username = 'joe@example.com';
            this.promise = this.account.authenticate();
          });

          it('should set account as unauthenticated', function () {
            expect(this.account._authenticated).to.not.be.ok();
          });

          it('should reject the promise', function () {
            expect(this.promise.state()).to.eql('rejected');
          });

          it('should trigger an `account:error:unauthenticated` event', function () {
            expect(this.hoodie.trigger.calledWith('account:error:unauthenticated')).to.be.ok();
          });

        });

        //_and('and the user has an anonymous acount', function () {

          //beforeEach(function () {
            //this.account.username = 'randomhash';
            //this.account.ownerHash = 'randomhash';
            //this.sandbox.stub(this.account, 'getAnonymousPassword').returns('randompass');
            //this.sandbox.spy(this.account, 'signIn');
            //this.promise = this.account.authenticate();
          //});

          //it('should sign in in the background, as we know the password anyway', function () {
            //expect(this.account.signIn.calledWith('randomhash', 'randompass')).to.be.ok();
          //});

        //});

      });

      _when('authentication request has an error', function () {

        beforeEach(function () {
          this.requestDefer.reject({
            responseText: 'error data'
          });
          this.promise = this.account.authenticate();
        });

        it('should reject the promise', function () {

          this.promise.then(this.noop, function (res) {
            expect(res).to.eql({ error: 'error data' });
          });

        });

      });

    });

  });


  xdescribe('#signUp(username, password)', function () {

    beforeEach(function () {
      this.account.ownerHash = 'owner_hash123';
    });

    _when('username not set', function () {

      beforeEach(function () {
        this.promise = this.account.signUp('', 'secret', {
          name: 'Joe Doe'
        });
      });

      it('should be rejected', function () {
        this.promise.then(this.noop, function (res) {
          expect(res).to.eql({ error: 'username must be set' });
        });
      });

    });

    _when('username set', function () {

      it('should downcase it', function () {
        var _ref = this.account.request.args[0];

        this.sandbox.stub(this.account, 'request');
        this.account.signUp('Joe', 'secret');

        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];

        expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe');
      });

      _and('user has an anonmyous account', function () {

        beforeEach(function () {
          var signInDefers;

          this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(true);
          this.fetchDefer = this.hoodie.defer();
          this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer.promise());
          this.sandbox.stub(this.hoodie.config, 'get').returns('randomPassword');
          this.account.username = 'randomUsername';
          this.signInDefer1 = this.hoodie.defer();
          this.signInDefer2 = this.hoodie.defer();

          signInDefers = [this.signInDefer1.promise(), this.signInDefer2.promise()];

          this.sandbox.stub(this.account, '_sendSignInRequest').returns(function () {
            signInDefers.shift();
          });

          this.promise = this.account.signUp('joe@example.com', 'secret', {
            name: 'Joe Doe'
          });

        });

        it('should sign in', function () {
          expect(this.account._sendSignInRequest.calledWith('randomUsername', 'randomPassword', {
            silent: true
          })).to.be.ok();
        });

        _when('sign in successful', function () {

          beforeEach(function () {
            this.signInDefer1.resolve('randomUsername');
            this.account.hasAnonymousAccount.returns(false);
          });

          it('should fetch the _users doc', function () {
            expect(this.account.fetch.called).to.not.be.ok();
          });

          _when('fetching user doc successful', function () {

            beforeEach(function () {
              var _ref = this.hoodie.request.mostRecentCall.args[0];

              this.sandbox.stub(this.account, '_now').returns('now');
              this.account._doc = {
                _id: 'org.couchdb.user:user/joe@example.com',
                name: 'user/joe@example.com',
                type: 'user',
                roles: [],
                salt: 'absalt',
                password_sha: 'pwcdef',
                createdAt: 'someday',
                updatedAt: 'someday'
              };
              this.fetchDefer.resolve();
              this.type = _ref[0],
              this.path = _ref[1],
              this.options = _ref[2];

              this.data = JSON.parse(this.options.data);
            });

            it('should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
              expect(this.hoodie.request.called).to.be.ok();
              expect(this.type).to.eql('PUT');
              expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2FrandomUsername');
            });

            it('should set contentType to \'application/json\'', function () {
              expect(this.options.contentType).to.eql('application/json');
            });

            it('should stringify the data', function () {
              expect(typeof this.options.data).to.eql('string');
            });

            it('should have set name to user \'joe@example.com\'', function () {
              expect(this.data.$newUsername).to.eql('joe@example.com');
            });

            it('should have set updatedAt to now', function () {
              expect(this.data.updatedAt).to.eql('now');
            });

            it('should have set signedUpAt to now', function () {
              expect(this.data.signedUpAt).to.eql('now');
            });

            _when('_users doc could be updated', function () {

              beforeEach(function () {
                this.sandbox.spy(this.hoodie.remote, 'disconnect');
                this.requestDefer.resolve();
              });

              it('should disconnect', function () {
                expect(this.hoodie.remote.disconnect.called).to.be.ok();
              });

              it('should sign in with new username', function () {
                expect(this.account._sendSignInRequest.calledWith('joe@example.com', 'secret')).to.be.ok();
              });

              _and('signIn is successful', function () {

                beforeEach(function () {
                  this.signInDefer2.resolve('joe@example.com');
                });

                it('should be resolved', function () {
                  this.promise.then(function (res) {
                    expect(res).to.eql('joe@example.com');
                  });
                });

              });

              _but('signIn has an error', function () {

                beforeEach(function () {
                  this.signInDefer2.reject({
                    error: 'oops'
                  });
                });

                it('should be resolved', function () {
                  this.promise.then(this.noop, function (res) {
                    expect(res).to.eql({
                      error: 'oops'
                    });
                  });
                });

              });

            });

            _when('_users doc could not be updated', function () {

              beforeEach(function () {
                this.requestDefer.reject();
              });

              it('should be rejected', function () {
                this.promise.then(this.noop, function (res) {
                  expect(res).to.eql({
                    error: 'unknown'
                  });
                });
              });

            });

          });

          _when('fetching user doc not successful', function () {

            beforeEach(function () {
              this.fetchDefer.reject({
                error: 'whatever'
              });
            });

            it('should be rejected', function () {
              this.promise.then(this.noop, function (res) {
                expect(res).to.eql({
                  error: 'whatever'
                });
              });
            });

          });

        });

      });

      _but('user is already logged in', function () {

        beforeEach(function () {
          this.sandbox.stub(this.account, 'hasAccount').returns(true);
        });

        it('should be rejected', function () {
          var promise = this.account.signUp('joe@example.com', 'secret');

          promise.then(this.noop, function (res) {
            expect(res).to.eql({ error: 'you have to sign out first' });
          });
        });

      });

      _and('user is logged out', function () {

        beforeEach(function () {
          this.signInDefer = this.hoodie.defer();

          this.sandbox.stub(this.account, 'hasAccount').returns(false);
          this.sandbox.stub(this.account, '_now').returns('now');
          this.sandbox.stub(this.account, '_sendSignInRequest').returns(this.signInDefer.promise());

          this.account.signUp('joe@example.com', 'secret');

          var _ref = this.hoodie.request.args[0];
          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);
        });

        it('should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          expect(this.hoodie.request.called).to.be.ok();
          expect(this.type).to.eql('PUT');
          expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
        });

        it('should set contentType to \'application/json\'', function () {
          expect(this.options.contentType).to.eql('application/json');
        });

        it('should stringify the data', function () {
          expect(typeof this.options.data).to.eql('string');
        });

        it('should have set _id to \'org.couchdb.user:joe@example.com\'', function () {
          expect(this.data._id).to.eql('org.couchdb.user:user/joe@example.com');
        });

        it('should have set name to \'user/joe@example.com\'', function () {
          expect(this.data.name).to.eql('user/joe@example.com');
        });

        it('should have set type to \'user\'', function () {
          expect(this.data.type).to.eql('user');
        });

        it('should have set password to \'secret\'', function () {
          expect(this.data.password).to.eql('secret');
        });

        it('should have set ownerHash to \'owner_hash123\'', function () {
          expect(this.data.ownerHash).to.eql('owner_hash123');
        });

        it('should have set database to \'user/owner_hash123\'', function () {
          expect(this.data.database).to.eql('user/owner_hash123');
        });

        it('should have set createdAt & updatedAt to now', function () {
          expect(this.data.createdAt).to.eql('now');
          expect(this.data.updatedAt).to.eql('now');
        });

        it('should have set signedUpAt to now', function () {
          expect(this.data.signedUpAt).to.eql('now');
        });

        it('should allow to signup without password', function () {
          var _ref = this.hoodie.request.args[0];

          this.account.signUp('joe@example.com');

          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);

          expect(this.data.password).to.eql('');
        });

        _when('signUp is anonymous', function () {

          beforeEach(function () {
            var options, path, promise, type;

            this.account.ownerHash = 'owner_hash123';

            promise = this.account.signUp('owner_hash123', 'secret');

            var _ref = this.hoodie.request.args[0];
            type = _ref[0],
            path = _ref[1],
            options = _ref[2];
            this.data = JSON.parse(options.data);
          });

          it('should not set signedUpAt if signed up anonymously', function () {
            expect(this.data.signedUpAt).to.eql(void 0);
          });

          it('should have set name to \'user_anonymous/owner_hash123\'', function () {
            expect(this.data.name).to.eql('user_anonymous/owner_hash123');
          });

        });

        _when('signUp successful', function () {

          beforeEach(function () {

            var response = {
              'ok': true,
              'id': 'org.couchdb.user:bizbiz',
              'rev': '1-a0134f4a9909d3b20533285c839ed830'
            };

            this.requestDefer.resolve(response);
          });

          it('should trigger `account:signup` event', function () {
            this.account.signUp('joe@example.com', 'secret');
            expect(this.hoodie.trigger.calledWith('account:signup', 'joe@example.com')).to.be.ok();
          });

          it('should sign in', function () {
            this.account.signUp('joe@example.com', 'secret');
            expect(this.account._sendSignInRequest.calledWith('joe@example.com', 'secret')).to.be.ok();
          });

          _and('signIn successful', function () {

            beforeEach(function () {
              this.signInDefer.resolve('joe@example.com', 'response');
            });

            it('should resolve its promise', function () {
              var promise = this.account.signUp('joe@example.com', 'secret');
              promise.then(function (res) {
                expect(res).to.eql('joe@example.com', 'response');
              });
            });

          });

          _and('signIn not successful', function () {

            beforeEach(function () {
              this.signInDefer.reject('error');
            });

            it('should resolve its promise', function () {
              var promise = this.account.signUp('joe@example.com', 'secret');

              promise.then(this.noop, function (res) {
                expect(res).to.eql('error');
              });
            });

          });

        });

        _when('signUp has an error', function () {

          beforeEach(function () {
            this.requestDefer.reject({
              responseText: '{\'error\':\'forbidden\',\'reason\':\'You stink.\'}'
            });
          });

          it('should reject its promise', function () {
            var promise = this.account.signUp('notmyfault@example.com', 'secret');

            promise.then(this.noop, function (res) {
              expect(res).to.eql({
                error: 'forbidden',
                reason: 'You stink.'
              });
            });

          });

        });

      });

    });

  });

  describe('#anonymousSignUp()', function () {

    beforeEach(function () {
      this.signUpDefer = this.hoodie.defer();

      this.sandbox.stub(this.account, 'signUp').returns(this.signUpDefer.promise());
      this.sandbox.stub(this.hoodie, 'uuid').returns('crazyuuid123');
      this.sandbox.spy(this.hoodie.config, 'set');

      this.account.ownerHash = 'owner_hash123';
    });

    it('should sign up with username = account.ownerHash and the random password', function () {
      this.account.anonymousSignUp();
      expect(this.account.signUp.calledWith('owner_hash123', 'crazyuuid123')).to.be.ok();
    });

    _when('signUp successful', function () {

      beforeEach(function () {
        this.signUpDefer.resolve();
      });

      it('should generate a password and store it locally in _account.anonymousPassword', function () {
        this.account.anonymousSignUp();
        expect(this.hoodie.uuid.calledWith(10)).to.be.ok();
        expect(this.hoodie.config.set.calledWith('_account.anonymousPassword', 'crazyuuid123')).to.be.ok();
      });

    });

  });

  xdescribe('#signIn(username, password)', function () {

    beforeEach(function () {
      this.signOutDefer = this.hoodie.defer();
      this.sandbox.stub(this.account, 'signOut').returns(this.signOutDefer.promise());
    });

    it('should sign out silently', function () {
      this.account.signIn('joe@example.com', 'secret');
      expect(this.account.signOut.calledWith({
        silent: true
      })).to.be.ok();
    });

    it('should downcase username', function () {
      var options, path, type, _ref;
      this.signOutDefer.resolve();
      this.account.signIn('Joe', 'secret');
      _ref = this.hoodie.request.args[0],
      type = _ref[0],
      path = _ref[1],
      options = _ref[2];

      expect(options.data.name).to.eql('user/joe');
    });

    _when('signing in with current username', function () {

      beforeEach(function () {
        var _ref;
        this.account.username = 'joe@example.com';
        this.account.signIn('joe@example.com', 'secret');
        _ref = this.hoodie.request.args[0],
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2], _ref;
      });

      it('should not sign out', function () {
        expect(this.account.signOut.called).to.not.be.ok();
      });

      it('should send a POST request to http://cou.ch/_session', function () {
        expect(this.hoodie.request.called).to.be.ok();
        expect(this.type).to.eql('POST');
        expect(this.path).to.eql('/_session');
      });

      _and('signIn successful', function () {

        beforeEach(function () {
          this.response = {
            'ok': true,
            'name': 'user/joe@example.com',
            'roles': ['user_hash', 'confirmed']
          };
          this.requestDefer.resolve(this.response);
        });

        it('should not trigger `account:cleanup` event', function () {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.hoodie.trigger.calledWith('account:cleanup')).to.not.be.ok();
        });

        it('should not trigger signin events', function () {
          expect(this.hoodie.trigger.calledWith('account:signin', 'joe@example.com')).to.not.be.ok();
          expect(this.hoodie.trigger.calledWith('account:signin:anonymous', 'joe@example.com')).to.not.be.ok();
        });

        it('should trigger reauthenticated event', function () {
          expect(this.hoodie.trigger.calledWith('account:reauthenticated', 'joe@example.com')).to.be.ok();
        });

      });

    });

    _when('signout errors', function () {

      beforeEach(function () {
        this.signOutDefer.reject({
          reason: 'a unicorn just cried'
        });
      });

      it('should return the rejected promise', function () {
        var promise = this.account.signOut();

        promise.then(this.noop, function (res) {
          expect(res).to.eql({
            reason: 'a unicorn just cried'
          });
        });

      });

    });

    _when('signout succeeds', function () {

      beforeEach(function () {
        var _ref;
        this.signOutDefer.resolve();
        this.account.signIn('joe@example.com', 'secret');

        _ref = this.hoodie.request.args[0],
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2], _ref;
      });

      it('should send a POST request to http://cou.ch/_session', function () {
        expect(this.hoodie.request.called).to.be.ok();
        expect(this.type).to.eql('POST');
        expect(this.path).to.eql('/_session');
      });

      it('should send username as name parameter', function () {
        expect(this.options.data.name).to.eql('user/joe@example.com');
      });

      it('should send password', function () {
        expect(this.options.data.password).to.eql('secret');
      });

      _and('signIn successful', function () {

        _and('account is confirmed', function () {

          beforeEach(function () {
            this.response = {
              'ok': true,
              'name': 'user/joe@example.com',
              'roles': ['user_hash', 'confirmed']
            };
            this.requestDefer.resolve(this.response);

            this.sandbox.spy(this.hoodie.config, 'set');

            delete this.account.username;
            this.hoodie.trigger.reset();
          });

          _and('user has an anonyomous account', function () {

            beforeEach(function () {
              this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(true);
            });

            it('should trigger `account:signin:anonymous` event', function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.hoodie.trigger.calledWith('account:signin:anonymous', 'joe@example.com')).to.be.ok();
            });

          });

          _and('user has a manual account', function () {

            beforeEach(function () {
              this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(false);
            });

            it('should trigger `account:signin` event', function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.hoodie.trigger.calledWith('account:signin', 'joe@example.com')).to.be.ok();
            });

          });

          it('should set @username', function () {
            this.account.signIn('joe@example.com', 'secret');

            expect(this.account.username).to.eql('joe@example.com');
            expect(this.hoodie.config.set.calledWith('_account.username', 'joe@example.com')).to.be.ok();
          });

          it('should set @ownerHash', function () {
            delete this.account.ownerHash;
            this.account.signIn('joe@example.com', 'secret');

            expect(this.account.ownerHash).to.eql('user_hash');
            expect(this.hoodie.config.set.calledWith('_account.ownerHash', 'user_hash')).to.be.ok();
            expect(this.hoodie.config.set.calledWith('createdBy', 'user_hash')).to.be.ok();
          });

          it('should fetch the _users doc', function () {
            this.sandbox.spy(this.account, 'fetch');
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.fetch.called).to.be.ok();
          });

          it('should resolve with username and response', function () {
            this.account.signIn('joe@example.com', 'secret').then(function (res) {
              expect(res).to.eql('joe@example.com', 'user_hash');
            });

          });

        });

        _and('account not (yet) confirmed', function () {

          beforeEach(function () {
            this.response = {
              'ok': true,
              'name': 'user/joe@example.com',
              'roles': []
            };
            this.requestDefer.resolve(this.response);
          });

          it('should reject with unconfirmed error.', function () {
            var promise = this.account.signIn('joe@example.com', 'secret');

            promise.fail(function (res) {
              expect(res).to.eql({
                error: 'unconfirmed',
                reason: 'account has not been confirmed yet'
              });
            });

          });

        });

        _and('account has an error', function () {

          beforeEach(function () {
            var _this = this;
            this.response = {
              'ok': true,
              'name': 'user/joe@example.com',
              'roles': ['error']
            };
            this.requestDefer.resolve(this.response);
            this.sandbox.stub(this.account, 'fetch').returns(function () {
              _this.account._doc.$error = 'because you stink!';
              return _this.hoodie.defer().resolve();
            });

          });

          it('should fetch user doc without setting @username', function () {
            this.account.signIn('joe@example.com', 'secret');

            expect(this.account.fetch.calledWith('joe@example.com')).to.be.ok();
            expect(this.account.username).to.be.undefined;
          });

          it('should reject with the reason', function () {
            this.account.signIn('joe@example.com', 'secret').fail(function (res) {
              expect(res).to.eqlRejectedWith({
                error: 'error',
                reason: 'because you stink!'
              });
            });
          });

        });

      });

      _when('signIn not succesful because unauthorized', function () {

        beforeEach(function () {
          this.response = {
            responseText: '{\'error\':\'unauthorized\',\'reason\':\'Name or password is incorrect.\'}'
          };
          this.requestDefer.reject(this.response);
        });

        it('should be rejected with unauthorized error', function () {
          this.account.signIn('joe@example.com', 'secret').fail(function (res) {
            expect(res).to.eqlRejectedWith({
              error: 'unauthorized',
              reason: 'Name or password is incorrect.'
            });
          });
        });

      });

      _when('sign in without password', function () {

        xit('should set password to empty string', function () {
          var data, options, path, type, _ref;
          this.account._requests = {};
          this.account.signIn('joe@example.com');

          _ref = this.hoodie.request.args[0],
          type = _ref[0],
          path = _ref[1],
          options = _ref[2];
          data = options.data;
          expect(data.password).to.eql('');
        });

      });

    });

  });

  describe('#changePassword(currentPassword, newPassword)', function () {

    beforeEach(function () {
      this.account.username = 'joe@example.com';
      this.account._doc = {
        _id: 'org.couchdb.user:user/joe@example.com',
        name: 'user/joe@example.com',
        type: 'user',
        roles: [],
        salt: 'absalt',
        password_sha: 'pwcdef',
        changedAt: 'someday',
        updatedAt: 'someday'
      };
      this.fetchPromise = this.hoodie.defer();

      this.sandbox.stub(this.account, 'fetch').returns(this.fetchPromise);
      this.sandbox.stub(this.account, '_now').returns('now');
    });

    it('should fetch the _users doc', function () {
      this.account.changePassword('currentSecret', 'newSecret');
      expect(this.account.fetch.called).to.be.ok();
    });

    _when('fetching _users doc successful', function () {

      beforeEach(function () {
        var _ref;
        this.fetchPromise.resolve();
        this.account.changePassword('currentSecret', 'newSecret');
        _ref = this.hoodie.request.args[0],

        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);
      });

      it('should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
        expect(this.hoodie.request.called).to.be.ok();
        expect(this.type).to.eql('PUT');
        expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });

      it('should set contentType to \'application/json\'', function () {
        expect(this.options.contentType).to.eql('application/json');
      });

      it('should stringify the data', function () {
        expect(typeof this.options.data).to.eql('string');
      });

      it('should have set _id to \'org.couchdb.user:user/joe@example.com\'', function () {
        expect(this.data._id).to.eql('org.couchdb.user:user/joe@example.com');
      });

      it('should have set name to \'user/joe@example.com\'', function () {
        expect(this.data.name).to.eql('user/joe@example.com');
      });

      it('should have set type to \'user\'', function () {
        expect(this.data.type).to.eql('user');
      });

      it('should have updatedAt to \'now\'', function () {
        expect(this.data.updatedAt).to.eql('now');
      });

      it('should not set createdAt to \'now\'', function () {
        expect(this.data.createdAt).to.not.eql('now');
      });

      it('should pass password', function () {
        expect(this.data.password).to.eql('newSecret');
      });

      xit('should allow to set empty password', function () {
        var _ref = this.hoodie.request.args[0];

        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);

        this.account.changePassword('currentSecret', '');
        expect(this.data.password).to.eql('');
      });

      it('should not send salt', function () {
        expect(this.data.salt).to.be.undefined;
      });

      xit('should not send password_sha', function () {
        expect(this.data.password_sha).to.be.undefined();
      });

      _when('change password successful', function () {

        beforeEach(function () {
          this.signInDefer = this.hoodie.defer();
          this.sandbox.stub(this.account, 'signIn').returns(this.signInDefer.promise());
          this.requestDefer.resolve({
            'ok': true,
            'id': 'org.couchdb.user:user/bizbiz',
            'rev': '2-345'
          });
        });

        it('should sign in', function () {
          this.account.changePassword('currentSecret', 'newSecret');
          expect(this.account.signIn.calledWith('joe@example.com', 'newSecret')).to.be.ok();
        });

        _when('sign in successful', function () {

          beforeEach(function () {
            this.signInDefer.resolve();
          });

          it('should resolve its promise', function () {
            var promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise.state()).to.eql('resolved');
          });

        });

        _when('sign in not successful', function () {

          beforeEach(function () {
            this.signInDefer.reject();
          });

          it('should reject its promise', function () {
            var promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise.state()).to.eql('rejected');
          });

        });

      });

      _when('change password has an error', function () {

        beforeEach(function () {
          this.requestDefer.reject();
        });

        it('should reject its promise', function () {
          var promise = this.account.changePassword('currentSecret', 'newSecret');
          promise.fail(function (res) {
            expect(res).to.eql({
              error: 'unknown'
            });
          });
        });

      });

    });

    _when('fetching _users has an error', function () {

      beforeEach(function () {
        this.fetchPromise.reject();
      });

      it('should reject its promise', function () {
        var promise = this.account.changePassword('currentSecret', 'newSecret');

        promise.fail(function (res) {
          expect(res).to.eql({
            error: 'unknown'
          });
        });
      });

    });

  });

  describe('#signOut(options)', function () {

    beforeEach(function () {
      this.sandbox.stub(this.hoodie, 'uuid').returns('newHash');
      this.sandbox.spy(this.hoodie.config, 'clear');
    });

    _when('called with silent: true', function () {

      it('should not trigger `account:signout` event', function () {
        this.account.signOut({
          silent: true
        });
        expect(this.hoodie.trigger.calledWith('account:signout')).to.not.be.ok();
      });

    });

    _when('user has no account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
        this.promise = this.account.signOut();
      });

      it('should not send any request', function () {
        expect(this.hoodie.request.called).to.not.be.ok();
      });

      it('should trigger `account:signout` event', function () {
        expect(this.hoodie.trigger.calledWith('account:signout')).to.be.ok();
      });

      it('should generate new @ownerHash hash', function () {
        expect(this.account.ownerHash).to.eql('newHash');
      });

      it('should unset @username', function () {
        expect(this.account.username).to.be.undefined;
      });

      it('should clear config', function () {
        expect(this.hoodie.config.clear.called).to.be.ok();
      });

      it('should return a resolved promise', function () {
        expect(this.promise.state()).to.eql('resolved');
      });

    });

    _when('user has account', function () {

      beforeEach(function () {
        this.sandbox.spy(this.hoodie.remote, 'disconnect');
        this.sandbox.stub(this.account, 'hasAccount').returns(true);
        this.account.signOut();

        var _ref = this.hoodie.request.args[0];

        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2],
        _ref;
      });

      it('should disconnect', function () {
        expect(this.hoodie.remote.disconnect.called).to.be.ok();
      });

      it('should send a DELETE request to http://cou.ch/_session', function () {
        expect(this.hoodie.request.called).to.be.ok();
        expect(this.type).to.eql('DELETE');
        expect(this.path).to.eql('/_session');
      });

      _when('signOut request successful', function () {

        beforeEach(function () {
          this.requestDefer.resolve();
          this.account.signOut();
        });

        it('should trigger `account:signout` event', function () {
          expect(this.hoodie.trigger.calledWith('account:signout')).to.be.ok();
        });

        it('should generate new @ownerHash hash', function () {
          expect(this.account.ownerHash).to.eql('newHash');
        });

        it('should unset @username', function () {
          expect(this.account.username).to.be.undefined;
        });

        it('should clear config', function () {
          expect(this.hoodie.config.clear.called).to.be.ok();
        });

      });

    });

  });

  describe('#hasAccount()', function () {

    _when('#username is undefined', function () {

      beforeEach(function () {
        delete this.account.username;
      });

      it('should return false', function () {
        expect(this.account.hasAccount()).to.eql(false);
      });
    });

    _when('#username is set', function () {

      beforeEach(function () {
        this.account.username = 'somebody';
        this.account.username;
      });

      it('should return false', function () {
        expect(this.account.hasAccount()).to.eql(true);
      });

    });

  });

  describe('#hasAnonymousAccount()', function () {

    _when('_account.anonymousPassword is set', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns(function (key) {
          if (key === '_account.anonymousPassword') {
            return 'password';
          }
        });
      });

      it('should return true', function () {
        expect(this.account.hasAnonymousAccount()).to.eql(true);
      });

    });

    _when('_account.anonymousPassword is not set', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns(function (key) {
          if (key === '_account.anonymousPassword') {
            return undefined;
          }
        });
      });

      xit('should return false', function () {
        expect(this.account.hasAnonymousAccount()).to.eql(false);
      });

    });

  });

  describe('#on(event, callback)', function () {

    beforeEach(function () {
      this.sandbox.spy(this.hoodie, 'on');
    });

    it('should proxy to @hoodie.on() and namespace with account', function () {
      var party = this.sandbox.spy();

      this.account.on('funky', party);
      expect(this.hoodie.on.calledWith('account:funky', party)).to.be.ok();
    });

    it('should namespace multiple events correctly', function () {
      var cb = this.sandbox.spy();

      this.account.on('super funky fresh', cb);
      expect(this.hoodie.on.calledWith('account:super account:funky account:fresh', cb)).to.be.ok();
    });
  });

  describe('#db()', function () {

    _when('account.ownerHash is \'owner_hash123\'', function () {

      beforeEach(function () {
        this.account.ownerHash = 'owner_hash123';
        this.account.ownerHash;
      });

      it('should return \'joe$example.com\'', function () {
        (expect(this.account.db())).to.eql('user/owner_hash123');
      });

    });

  });

  describe('#fetch()', function () {

    _when('username is not set', function () {

      beforeEach(function () {
        this.account.username = null;
        this.account.fetch();
      });

      it('should not send any request', function () {
        expect(this.hoodie.request.called).to.not.be.ok();
      });

    });

    _when('username is joe@example.com', function () {

      beforeEach(function () {
        this.account.username = 'joe@example.com';
        this.account.fetch();

        var _ref = this.hoodie.request.args[0];

        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2],
        _ref;
      });

      it('should send a GET request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
        expect(this.hoodie.request.called).to.be.ok();
        expect(this.type).to.eql('GET');
        expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });

      _when('successful', function () {

        beforeEach(function () {
          this.response = {
            '_id': 'org.couchdb.user:baz',
            '_rev': '3-33e4d43a6dff5b29a4bd33f576c7824f',
            'name': 'baz',
            'salt': '82163606fa5c100e0095ad63598de810',
            'password_sha': 'e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e',
            'type': 'user',
            'roles': []
          };
          this.requestDefer.resolve(this.response);
        });

        it('should resolve its promise', function () {
          var promise = this.account.fetch(), self = this;

          promise.fail(function (res) {
            expect(res).to.eql(self.response);
          });
        });

      });

      _when('fails', function () {

        beforeEach(function () {
          this.error = {
            error: 'ErrorName',
            reason: 'ErrorReason'
          };
          this.requestDefer.reject(this.error);
        });

        it('should resolve its promise', function () {
          var promise = this.account.fetch(), self = this;

          promise.fail(function (res) {
            expect(res).to.eql(self.error);
          });
        });

      });

    });

  });

  describe('#destroy()', function () {

    beforeEach(function () {
      this.fetchDefer = this.hoodie.defer();
      this.sandbox.spy(this.hoodie.remote, 'disconnect');
      this.sandbox.spy(this.hoodie.config, 'clear');
      this.sandbox.spy(this.hoodie.config, 'set');
      this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer.promise());
      this.sandbox.stub(this.hoodie, 'uuid').returns('newHash');
      this.account.username = 'joe@example.com';
      this.account._doc = {
        _rev: '1-234'
      };
    });

    _when('user has account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(true);
      });

      _and('fetch is successful', function () {

        beforeEach(function () {
          this.fetchDefer.resolve();
        });

        it('should return a promise', function () {
          expect(this.account.destroy().state()).to.eql('resolved');
        });

        it('should disconnect', function () {
          this.account.destroy();
          expect(this.hoodie.remote.disconnect.called).to.be.ok();
        });

        it('should fetch the account', function () {
          this.account.destroy();
          expect(this.account.fetch.called).to.be.ok();
        });

        it('should send a PUT request to /_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          this.account.destroy();
          expect(this.hoodie.request.calledWith('PUT', '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', {
            data: JSON.stringify({
              _rev: '1-234',
              _deleted: true
            }),
            contentType: 'application/json'
          })).to.be.ok();
        });

        _and('destroy request succesful', function () {

          beforeEach(function () {
            this.requestDefer.resolve();
            this.account.destroy();
          });

          it('should unset @username', function () {
            expect(this.account.username).to.be.undefined;
          });

          it('should regenerate @ownerHash', function () {
            expect(this.account.ownerHash).to.eql('newHash');
          });

          it('should trigger signout event', function () {
            expect(this.hoodie.trigger.calledWith('account:signout')).to.be.ok();
          });

          it('should clear config', function () {
            expect(this.hoodie.config.clear.called).to.be.ok();
          });

          it('should set config._account.ownerHash to new @ownerHash', function () {
            expect(this.hoodie.config.set.calledWith('_account.ownerHash', 'newHash')).to.be.ok();
          });

          it('should trigger clenaup event', function() {
            expect(this.hoodie.trigger.calledWith('account:cleanup')).to.be.ok();
          });

        });

      });

      _and('fetch fails with not_found', function () {

        beforeEach(function () {
          this.error = {
            error: 'not_found',
            reason: 'missing'
          };
          this.fetchDefer.reject(this.error);
          this.promise = this.account.destroy();
          this.promise;
        });

        it('should resolve anyway', function () {
          expect(this.promise.state()).to.eql('resolved');
        });

      });

      _and('fetch fails with unknown error', function () {

        beforeEach(function () {
          this.error = {
            error: 'unknown'
          };
          this.fetchDefer.reject(this.error);
          this.promise = this.account.destroy();
          this.promise;
        });

        it('should reject', function () {
          var self = this;

          this.promise.fail(function (res) {
            expect(res).to.eql(self.error);
          });
        });

        it('should not unset @username', function () {
          expect(this.account.username).to.eql('joe@example.com');
        });

        it('should not regenerate @ownerHash', function () {
          expect(this.account.ownerHash).to.eql('uuid');
        });

        it('should not trigger signout event', function () {
          expect(this.hoodie.trigger.calledWith('account:signout')).to.not.be.ok();
        });

        it('should not clear config', function () {
          expect(this.hoodie.config.clear.called).to.not.be.ok();
        });

      });

    });

    _when('user has no account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
        this.promise = this.account.destroy();
      });

      it('should return a promise', function () {
        expect(this.promise.state()).to.eql('resolved');
      });

      it('should not try to fetch', function () {
        expect(this.account.fetch.called).to.not.be.ok();
      });

      it('should unset @username', function () {
        expect(this.account.username).to.be.undefined;
      });

      it('should regenerate @ownerHash', function () {
        expect(this.account.ownerHash).to.eql('newHash');
      });

      it('should trigger signout event', function () {
        expect(this.hoodie.trigger.calledWith('account:signout')).to.be.ok();
      });

      it('should clear config', function () {
        expect(this.hoodie.config.clear.called).to.be.ok();
      });

      it('should set config._account.ownerHash to new @ownerHash', function () {
        expect(this.hoodie.config.set.calledWith('_account.ownerHash', 'newHash')) .to.be.ok();
      });

    });

  });

  xdescribe('#resetPassword(username)', function () {

    beforeEach(function () {
      this.sandbox.stub(this.account, '_checkPasswordResetStatus').returns('checkPasswordResetPromise');
    });

    _when('there is a pending password reset request', function () {

      beforeEach(function () {
        this.sandbox.stub(this.hoodie.config, 'get').returns('joe/uuid567');
        this.account.resetPassword();
      });

      it('should not send another request', function () {
        expect(this.hoodie.request.called).to.not.be.ok();
      });

      it('should check for the status of the pending request', function () {
        expect(this.account._checkPasswordResetStatus.called).to.be.ok();
      });

      it('should return the promise by the status request', function () {
        expect(this.account.resetPassword()).to.eql('checkPasswordResetPromise');
      });

    });

    _when('there is no pending password reset request', function () {

      beforeEach(function () {
        var _ref;

        this.sandbox.stub(this.hoodie.config, 'get').returns(void 0);
        this.sandbox.spy(this.hoodie.config, 'set');
        this.sandbox.stub(this.account, '_now').returns('now');
        this.sandbox.stub(this.hoodie, 'uuid').returns('uuid567');

        this.account.resetPassword('joe@example.com');

        _ref = this.hoodie.request.args[0],

        this.method = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);
      });

      it('should generate a reset Password Id and store it locally', function () {
        expect(this.hoodie.config.set.calledWith('_account.resetPasswordId', 'joe@example.com/uuid567')).to.be.ok();
      });

      it('should send a PUT request to /_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567', function () {
        expect(this.method).to.eql('PUT');
        expect(this.path).to.eql('/_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567');
      });

      it('should send data with contentType \'application/json\'', function () {
        expect(this.options.contentType).to.eql('application/json');
      });

      it('should send a new _users object', function () {
        expect(this.data._id).to.eql('org.couchdb.user:$passwordReset/joe@example.com/uuid567');
        expect(this.data.name).to.eql('$passwordReset/joe@example.com/uuid567');
        expect(this.data.type).to.eql('user');
        expect(this.data.password).to.eql('joe@example.com/uuid567');
        expect(this.data.createdAt).to.eql('now');
        expect(this.data.updatedAt).to.eql('now');
      });

      it('should return a promise', function () {
        expect(this.account.resetPassword('joe@example.com')).to.eqlPromise();
      });

      _when('reset Password request successful', function () {

        beforeEach(function () {
          this.promiseSpy = this.sandbox.spy();
          this.account._checkPasswordResetStatus.returns({
            then: this.promiseSpy
          });
          this.requestDefer.resolve();
        });

        it('should check for the request status', function () {
          this.account.resetPassword('joe@example.com');
          expect(this.account._checkPasswordResetStatus.called).to.be.ok();
        });

        it('should be resolved', function () {
          expect(this.account.resetPassword('joe@example.com')).to.eqlResolved();
        });

      });

      _when('reset Password request is not successful', function () {
        beforeEach(function () {
          this.requestDefer.reject({responseText: '{\'error\': \'ooops\'}'});
        });

        it('should be rejected with the error', function () {
          expect(this.account.resetPassword('joe@example.com')).to.eqlRejectedWith({
            error: 'ooops'
          });
        });

      });

    });

  });


  xdescribe('#resetPassword(username)', function () {

    it('should proxy to hoodie.trigger', function() {
      this.account.trigger('say', 'funky', 'fresh');
      expect(this.hoodie.trigger.calledWith('account:say', 'funky', 'fresh')).to.be.ok();
    });

  });

  xdescribe('#changeUsername(currentPassword, newUsername)', function () {

    beforeEach(function () {
      var signInDefers;

      this.signInDefer1 = this.hoodie.defer();
      this.signInDefer2 = this.hoodie.defer();

      signInDefers = [this.signInDefer1, this.signInDefer2];

      this.sandbox.stub(this.account, '_sendSignInRequest').call(function () {
        return signInDefers.shift();
      });

      this.fetchDefer = this.hoodie.defer();

      this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer);
      this.sandbox.stub(this.account, '_now').returns('now');

      this.account.username = 'joe@example.com';
      this.account._doc = {
        _id: 'org.couchdb.user:user/joe@example.com',
        name: 'user/joe@example.com',
        type: 'user',
        roles: [],
        salt: 'absalt',
        password_sha: 'pwcdef',
        updatedAt: 'someday',
        createdAt: 'someday'
      };
    });

    it('should return a promise', function () {
      this.account.changeUsername('secret', 'new.joe@example.com');
      expect(this.account.changeUsername).to.have.property('done');
      expect(this.account.changeUsername).to.not.have.property('resolved');

    });

    it('should downcase new username', function () {
      this.sandbox.spy(this.account, '_changeUsernameAndPassword');

      this.account.changeUsername('secret', 'Joe');
      expect(this.account._changeUsernameAndPassword.calledWith('secret', 'joe')).to.be.ok();
    });

    _when('sign in successful', function () {

      beforeEach(function () {
        this.signInDefer1.resolve('joe@example.com');
      });

      it('should fetch the _users doc', function () {
        this.account.changeUsername('secret', 'new.joe@example.com');

        expect(this.account.fetch.called).to.be.ok();
      });

      _and('_users doc can be fetched', function () {

        beforeEach(function () {
          this.fetchDefer.resolve();
          this.account.username = 'joe@example.com';
          this.promise = this.account.changeUsername('secret', 'new.joe@example.com');

          var _ref = this.hoodie.request.args[0];

          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);
        });

        it('should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          expect(this.hoodie.request.called).to.be.ok();
          expect(this.type).to.eql('PUT');
          expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
        });

        it('should set contentType to \'application/json\'', function () {
          expect(this.options.contentType).to.eql('application/json');
        });

        it('should stringify the data', function () {
          expect(typeof this.options.data).to.eql('string');
        });

        it('should have set name to user \'joe@example.com\'', function () {
          expect(this.data.$newUsername).to.eql('new.joe@example.com');
        });

        it('should have set updatedAt to \'now\'', function () {
          expect(this.data.updatedAt).to.eql('now');
        });

        it('should not set createdAt to \'now\'', function () {
          expect(this.data.createdAt).to.not.eql('now');
        });

        _when('_users doc could be updated', function () {

          beforeEach(function () {
            this.sandbox.spy(this.hoodie.remote, 'disconnect');
            this.requestDefer.resolve();
          });

          it('should disconnect', function () {
            expect(this.hoodie.remote.disconnect.called).to.be.ok();
          });

          it('should sign in with new username', function () {
            expect(this.account._sendSignInRequest.calledWith('new.joe@example.com', 'secret')).to.be.ok();
          });

          _and('signIn is successful', function () {

            beforeEach(function () {
              this.signInDefer2.resolve('fuckyeah');
            });

            it('should be resolved', function () {
              this.promise.then(function (res) {
                expect(res).to.eql('fuckyeah');
              });
            });

          });

          _but('signIn has an error', function () {

            beforeEach(function () {
              this.signInDefer2.reject({
                error: 'oops'
              });
            });

            it('should be resolved', function () {
              this.promise.then(function (res) {
                expect(res).to.eql({
                  error: 'oops'
                });
              });
            });

          });

        });

        _when('_users doc could not be updated', function () {

          beforeEach(function () {
            this.requestDefer.reject();
          });

          it('should be rejected', function () {
            this.promise.then(function (res) {
              expect(res).to.eql({
                error: 'unknown'
              });
            });
          });

        });

      });

      _but('_users doc cannot be fetched', function () {

        beforeEach(function () {
          this.fetchDefer.reject({
            error: 'something'
          });
        });

        it('should be rejected', function () {
          var promise = this.account.changeUsername('secret', 'new.joe@example.com');

          promise.then(function (res) {
            expect(res).to.eql({
              error: 'something'
            });
          });
        });

      });

    });

    _when('signIn not successful', function () {

      beforeEach(function () {
        this.signInDefer1.reject({
          error: 'autherror'
        });
      });

      it('should be rejected', function () {
        var promise = this.account.changeUsername('secret', 'new.joe@example.com');
        promise.fail(function (res) {
          expect(res).to.eql({
            error: 'autherror'
          });
        });

      });

    });

  });

});

