describe("Hoodie.Account", function () {

  'use strict';

  beforeEach(function () {

    localStorage.clear();

    this.hoodie = new Mocks.Hoodie();
    this.requestDefer = this.hoodie.defer();

    spyOn(this.hoodie, "request").andReturn(this.requestDefer.promise());
    spyOn(this.hoodie, "trigger");
    spyOn(window, "setTimeout").andCallFake(function (cb) {
      return cb();
    });

    this.account = new Hoodie.Account(this.hoodie);
    this.hoodie.request.reset();
    this.account._requests = {};
  });

  describe("constructor", function () {

    beforeEach(function () {
      spyOn(Hoodie.Account.prototype, "on");
    });

    _when("account.username is set", function () {

      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andCallFake(function (key) {
          if (key === '_account.username') {
            return 'joe@example.com';
          }
        });
      });

      it("should set @username", function () {
        var account;
        account = new Hoodie.Account(this.hoodie);
        expect(account.username).toBe('joe@example.com');
      });
    });

    _when("account.ownerHash is set", function () {

      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andCallFake(function (key) {
          if (key === '_account.ownerHash') {
            return 'owner_hash123';
          }
        });
      });

      it("should set @ownerHash", function () {
        var account;
        account = new Hoodie.Account(this.hoodie);
        expect(account.ownerHash).toBe('owner_hash123');
      });

    });

    _when("account.ownerHash isn't set", function () {

      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andReturn(false);
        spyOn(this.hoodie, "uuid").andReturn('new_generated_owner_hash');
        spyOn(this.hoodie.config, "set");
      });

      it("should set @ownerHash", function () {
        var account;
        account = new Hoodie.Account(this.hoodie);
        expect(account.ownerHash).toBe('new_generated_owner_hash');
      });

      it("should set account.ownerHash", function () {
        var account;
        account = new Hoodie.Account(this.hoodie);
        expect(account.hoodie.config.set).wasCalledWith('_account.ownerHash', 'new_generated_owner_hash');
      });
    });

    it("should authenticate on next tick", function () {
      var account = new Hoodie.Account(this.hoodie);
      expect(window.setTimeout).wasCalledWith(account.authenticate);
    });

    it("should check for a pending password request", function () {
      spyOn(Hoodie.Account.prototype, "_checkPasswordResetStatus");
      var account = new Hoodie.Account(this.hoodie);

      expect(Hoodie.Account.prototype._checkPasswordResetStatus).wasCalled();
    });

  });

  describe("#authenticate()", function () {

    beforeEach(function () {
      window.setTimeout.andCallFake(function () {});
      this.account = new Hoodie.Account(this.hoodie);
    });

    _when("account is already authenticated", function () {

      beforeEach(function () {
        this.account._authenticated = true;
        this.account.username = 'joe@example.com';
        this.promise = this.account.authenticate();
      });

      it("should return a promise", function () {
        expect(this.promise).toBePromise();
      });

      it("should resolve the promise", function () {
        expect(this.promise).toBeResolvedWith('joe@example.com');
      });
    });

    _when("account is unauthenticated", function () {

      beforeEach(function () {
        this.account._authenticated = false;
        this.promise = this.account.authenticate();
      });

      it("should return a promise", function () {
        expect(this.promise).toBePromise();
      });

      it("should reject the promise", function () {
        expect(this.promise).toBeRejected();
      });
    });

    _when("there is a pending singIn request", function () {

      beforeEach(function () {
        this.signInDefer = this.hoodie.defer();
        this.account._requests.signIn = this.signInDefer.promise();
      });

      it("it should be rejected when it is pending and then fails", function () {
        var promise = this.account.authenticate();
        this.signInDefer.reject("nope");

        expect(promise).toBeRejectedWith("nope");
      });

      it("it should be resolved when it is pending and then succeeds", function () {
        var promise = this.account.authenticate();
        this.signInDefer.resolve("funky");
        expect(promise).toBeResolvedWith("funky");
      });
    });

    _when("there is a pending singOut request", function () {

      beforeEach(function () {
        this.signOutDefer = this.hoodie.defer();
        this.account._requests.signOut = this.signOutDefer.promise();
      });

      it("it should be rejected when it is pending and then fails", function () {
        var promise = this.account.authenticate();
        this.signOutDefer.reject("nope");

        expect(promise).toBeRejectedWith("nope");
      });
      it("it should be rejected anyway, even if the pending request succeeds", function () {
        var promise = this.account.authenticate();
        this.signOutDefer.resolve("funky");

        expect(promise).toBeRejectedWith("funky");
      });
    });

    _when("account.username is not yet set", function () {

      it("should send a sign out request, but not cleanup", function () {
        this.account.authenticate();
        expect(this.hoodie.request).wasCalledWith('DELETE', '/_session');
      });

      _and("signOut succeeds", function () {

        beforeEach(function () {
          this.requestDefer.resolve();
        });

        it("should return a rejected promise", function () {
          expect(this.account.authenticate()).toBeRejected();
        });

      });

      _and("signOut fails", function () {

        beforeEach(function () {
          this.requestDefer.reject();
        });

        it("should return a rejected promise", function () {
          expect(this.account.authenticate()).toBeRejected();
        });

      });

    });

    _when("username is set not set", function () {

      beforeEach(function () {
        delete this.account.username;
        this.signOutDefer = this.hoodie.defer();
        this.account._requests.signOut = this.signOutDefer.promise();
        this.promise = this.account.authenticate();
      });

      _and("signOut succeeds", function () {

        beforeEach(function () {
          this.signOutDefer.resolve();
        });

        it("should return a rejected promise", function () {
          expect(this.promise).toBeRejected();
        });

      });

      _and("signOut fails", function () {

        beforeEach(function () {
          this.signOutDefer.reject();
        });

        it("should return a rejected promise", function () {
          expect(this.promise).toBeRejected();
        });

      });

    });

    _when("account has not been authenticated yet", function () {

      beforeEach(function () {
        this.account.username = 'joe@example.com';
        delete this.account._authenticated;
      });

      it("should return a promise", function () {
        expect(this.account.authenticate()).toBePromise();
      });

      it("should send a GET /_session", function () {
        var args;
        this.account.authenticate();
        expect(this.hoodie.request).wasCalled();
        args = this.hoodie.request.mostRecentCall.args;
        expect(args[0]).toBe('GET');
        expect(args[1]).toBe('/_session');
      });

      it("should not send multiple GET /_session requests", function () {
        this.account.authenticate();
        this.account.authenticate();
        expect(this.hoodie.request.callCount).toBe(1);
      });
      _when("authentication request is successful and returns session info for joe@example.com", function () {
        beforeEach(function () {
          spyOn(this.hoodie.config, "set");
          this.response = {
            userCtx: {
              name: "user/joe@example.com",
              roles: ["user_hash", "confirmed"]
            }
          };
          this.requestDefer.resolve(this.response);
          this.promise = this.account.authenticate();
        });
        it("should set account as authenticated", function () {
          expect(this.account._authenticated).toBe(true);
        });
        it("should resolve the promise with 'joe@example.com'", function () {
          expect(this.promise).toBeResolvedWith('joe@example.com');
        });
        it("should set account.username", function () {
          expect(this.account.username).toBe('joe@example.com');
        });
        it("should not set _account.username config", function () {
          expect(this.hoodie.config.set).wasNotCalledWith('_account.username', 'joe@example.com');
        });
        it("should set account.ownerHash", function () {
          expect(this.account.ownerHash).toBe('user_hash');
          expect(this.hoodie.config.set).wasCalledWith('_account.ownerHash', 'user_hash');
        });
      });
      _when("authentication request is successful and returns `name: null`", function () {
        beforeEach(function () {
          this.requestDefer.resolve({
            userCtx: {
              name: null
            }
          });
        });
        _and("the user signed up", function () {
          beforeEach(function () {
            this.account.username = 'joe@example.com';
            this.promise = this.account.authenticate();
          });
          it("should set account as unauthenticated", function () {
            expect(this.account._authenticated).toBe(false);
          });
          it("should reject the promise", function () {
            expect(this.promise).toBeRejected();
          });
          it("should trigger an `account:error:unauthenticated` event", function () {
            expect(this.hoodie.trigger).wasCalledWith('account:error:unauthenticated');
          });
        });
        _and("and the user has an anonymous acount", function () {
          beforeEach(function () {
            this.account.username = 'randomhash';
            this.account.ownerHash = 'randomhash';
            spyOn(this.account, "getAnonymousPassword").andReturn('randompass');
            spyOn(this.account, "signIn");
            this.promise = this.account.authenticate();
          });
          it("should sign in in the background, as we know the password anyway", function () {
            expect(this.account.signIn).wasCalledWith('randomhash', 'randompass');
          });
        });
      });
      _when("authentication request has an error", function () {
        beforeEach(function () {
          this.requestDefer.reject({
            responseText: 'error data'
          });
          this.promise = this.account.authenticate();
        });
        it("should reject the promise", function () {
          expect(this.promise).toBeRejectedWith({
            error: 'error data'
          });
        });
      });
    });
  });

  
  describe("#signUp(username, password)", function () {
    beforeEach(function () {
      this.account.ownerHash = "owner_hash123";
    });
    _when("username not set", function () {
      beforeEach(function () {
        this.promise = this.account.signUp('', 'secret', {
          name: "Joe Doe"
        });
      });
      it("should be rejected", function () {
        expect(this.promise).toBeRejectedWith({
          error: 'username must be set'
        });
      });
    });
    _when("username set", function () {
      it("should downcase it", function () {
        var _ref;
        spyOn(this.account, "request").andCallThrough();
        this.account.signUp('Joe', 'secret');
        _ref = this.account.request.mostRecentCall.args,
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe');
      });
      _and("user has an anonmyous account", function () {
        beforeEach(function () {
          var signInDefers;
          spyOn(this.account, "hasAnonymousAccount").andReturn(true);
          this.fetchDefer = this.hoodie.defer();
          spyOn(this.account, "fetch").andReturn(this.fetchDefer.promise());
          spyOn(this.hoodie.config, "get").andReturn('randomPassword');
          this.account.username = 'randomUsername';
          this.signInDefer1 = this.hoodie.defer();
          this.signInDefer2 = this.hoodie.defer();
          signInDefers = [this.signInDefer1.promise(), this.signInDefer2.promise()];
          spyOn(this.account, "_sendSignInRequest").andCallFake(function () {
            return signInDefers.shift();
          });
          this.promise = this.account.signUp('joe@example.com', 'secret', {
            name: "Joe Doe"
          });
        });
        it("should sign in", function () {
          expect(this.account._sendSignInRequest).wasCalledWith('randomUsername', 'randomPassword', {
            silent: true
          });
        });
        _when("sign in successful", function () {
          beforeEach(function () {
            this.signInDefer1.resolve('randomUsername');
            this.account.hasAnonymousAccount.andReturn(false);
          });
          it("should fetch the _users doc", function () {
            expect(this.account.fetch).wasCalled();
          });
          _when("fetching user doc successful", function () {
            beforeEach(function () {
              var _ref;
              spyOn(this.account, "_now").andReturn('now');
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
              _ref = this.hoodie.request.mostRecentCall.args,
              this.type = _ref[0], this.path = _ref[1], this.options = _ref[2];
              this.data = JSON.parse(this.options.data);
            });
            it("should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
              expect(this.hoodie.request).wasCalled();
              expect(this.type).toBe('PUT');
              expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2FrandomUsername');
            });
            it("should set contentType to 'application/json'", function () {
              expect(this.options.contentType).toBe('application/json');
            });
            it("should stringify the data", function () {
              expect(typeof this.options.data).toBe('string');
            });
            it("should have set name to 'user/joe@example.com", function () {
              expect(this.data.$newUsername).toBe('joe@example.com');
            });
            it("should have set updatedAt to now", function () {
              expect(this.data.updatedAt).toBe('now');
            });
            it("should have set signedUpAt to now", function () {
              expect(this.data.signedUpAt).toBe('now');
            });
            _when("_users doc could be updated", function () {
              beforeEach(function () {
                spyOn(this.hoodie.remote, "disconnect");
                this.requestDefer.resolve();
              });
              it("should disconnect", function () {
                expect(this.hoodie.remote.disconnect).wasCalled();
              });
              it("should sign in with new username", function () {
                expect(this.account._sendSignInRequest).wasCalledWith('joe@example.com', 'secret');
              });
              _and("signIn is successful", function () {
                beforeEach(function () {
                  this.signInDefer2.resolve('joe@example.com');
                });
                it("should be resolved", function () {
                  expect(this.promise).toBeResolvedWith('joe@example.com');
                });
              });
              _but("signIn has an error", function () {
                beforeEach(function () {
                  this.signInDefer2.reject({
                    error: 'oops'
                  });
                });
                it("should be resolved", function () {
                  expect(this.promise).toBeRejectedWith({
                    error: 'oops'
                  });
                });
              });
            });
            _when("_users doc could not be updated", function () {
              beforeEach(function () {
                this.requestDefer.reject();
              });
              it("should be rejected", function () {
                expect(this.promise).toBeRejectedWith({
                  error: 'unknown'
                });
              });
            });
          });
          _when("fetching user doc not successful", function () {
            beforeEach(function () {
              this.fetchDefer.reject({
                error: 'whatever'
              });
            });
            it("should be rejected", function () {
              expect(this.promise).toBeRejectedWith({
                error: 'whatever'
              });
            });
          });
        });
      });
      _but("user is already logged in", function () {
        beforeEach(function () {
          spyOn(this.account, "hasAccount").andReturn(true);
        });
        it("should be rejected", function () {
          var promise;
          promise = this.account.signUp('joe@example.com', 'secret');
          expect(promise).toBeRejectedWith({
            error: 'you have to sign out first'
          });
        });
      });
      _and("user is logged out", function () {
        beforeEach(function () {
          var _ref;
          this.signInDefer = this.hoodie.defer();
          spyOn(this.account, "hasAccount").andReturn(false);
          spyOn(this.account, "_now").andReturn('now');
          spyOn(this.account, "_sendSignInRequest").andReturn(this.signInDefer.promise());
          this.account.signUp('joe@example.com', 'secret');
          _ref = this.hoodie.request.mostRecentCall.args,
          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);
        });
        it("should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
          expect(this.hoodie.request).wasCalled();
          expect(this.type).toBe('PUT');
          expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
        });
        it("should set contentType to 'application/json'", function () {
          expect(this.options.contentType).toBe('application/json');
        });
        it("should stringify the data", function () {
          expect(typeof this.options.data).toBe('string');
        });
        it("should have set _id to 'org.couchdb.user:joe@example.com'", function () {
          expect(this.data._id).toBe('org.couchdb.user:user/joe@example.com');
        });
        it("should have set name to 'user/joe@example.com", function () {
          expect(this.data.name).toBe('user/joe@example.com');
        });
        it("should have set type to 'user", function () {
          expect(this.data.type).toBe('user');
        });
        it("should have set password to 'secret'", function () {
          expect(this.data.password).toBe('secret');
        });
        it("should have set ownerHash to 'owner_hash123'", function () {
          expect(this.data.ownerHash).toBe('owner_hash123');
        });
        it("should have set database to 'user/owner_hash123'", function () {
          expect(this.data.database).toBe('user/owner_hash123');
        });
        it("should have set createdAt & updatedAt to now", function () {
          expect(this.data.createdAt).toBe('now');
          expect(this.data.updatedAt).toBe('now');
        });
        it("should have set signedUpAt to now", function () {
          expect(this.data.signedUpAt).toBe('now');
        });
        it("should allow to signup without password", function () {
          var _ref;
          this.account.signUp('joe@example.com');
          _ref = this.hoodie.request.mostRecentCall.args,
          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);
          expect(this.data.password).toBe('');
        });
        _when("signUp is anonymous", function () {
          beforeEach(function () {
            var options, path, promise, type, _ref;
            this.account.ownerHash = "owner_hash123";
            promise = this.account.signUp("owner_hash123", 'secret');
            _ref = this.hoodie.request.mostRecentCall.args,
            type = _ref[0],
            path = _ref[1],
            options = _ref[2];
            this.data = JSON.parse(options.data);
          });
          it("should not set signedUpAt if signed up anonymously", function () {
            expect(this.data.signedUpAt).toBe(void 0);
          });
          it("should have set name to 'user_anonymous/owner_hash123", function () {
            expect(this.data.name).toBe('user_anonymous/owner_hash123');
          });
        });
        _when("signUp successful", function () {
          beforeEach(function () {
            var response;
            response = {
              "ok": true,
              "id": "org.couchdb.user:bizbiz",
              "rev": "1-a0134f4a9909d3b20533285c839ed830"
            };
            this.requestDefer.resolve(response);
          });
          it("should trigger `account:signup` event", function () {
            this.account.signUp('joe@example.com', 'secret');
            expect(this.hoodie.trigger).wasCalledWith('account:signup', 'joe@example.com');
          });
          it("should sign in", function () {
            this.account.signUp('joe@example.com', 'secret');
            expect(this.account._sendSignInRequest).wasCalledWith('joe@example.com', 'secret');
          });
          _and("signIn successful", function () {
            beforeEach(function () {
              this.signInDefer.resolve("joe@example.com", 'response');
            });
            it("should resolve its promise", function () {
              var promise;
              promise = this.account.signUp('joe@example.com', 'secret');
              expect(promise).toBeResolvedWith('joe@example.com', 'response');
            });
          });
          _and("signIn not successful", function () {
            beforeEach(function () {
              this.signInDefer.reject('error');
            });
            it("should resolve its promise", function () {
              var promise;
              promise = this.account.signUp('joe@example.com', 'secret');
              expect(promise).toBeRejectedWith('error');
            });
          });
        });
        _when("signUp has an error", function () {
          beforeEach(function () {
            this.requestDefer.reject({
              responseText: '{"error":"forbidden","reason":"You stink."}'
            });
          });
          it("should reject its promise", function () {
            var promise;
            promise = this.account.signUp('notmyfault@example.com', 'secret');
            expect(promise).toBeRejectedWith({
              error: 'forbidden',
              reason: 'You stink.'
            });
          });
        });
      });
    });
  });
  describe("#anonymousSignUp()", function () {
    beforeEach(function () {
      this.signUpDefer = this.hoodie.defer();
      spyOn(this.account, "signUp").andReturn(this.signUpDefer.promise());
      spyOn(this.hoodie, "uuid").andReturn("crazyuuid123");
      spyOn(this.hoodie.config, "set");
      this.account.ownerHash = "owner_hash123";
    });
    it("should sign up with username = account.ownerHash and the random password", function () {
      this.account.anonymousSignUp();
      expect(this.account.signUp).wasCalledWith('owner_hash123', 'crazyuuid123');
    });
    _when("signUp successful", function () {
      beforeEach(function () {
        this.signUpDefer.resolve();
      });
      it("should generate a password and store it locally in _account.anonymousPassword", function () {
        this.account.anonymousSignUp();
        expect(this.hoodie.uuid).wasCalledWith(10);
        expect(this.hoodie.config.set).wasCalledWith('_account.anonymousPassword', 'crazyuuid123');
      });
    });
  });
  describe("#signIn(username, password)", function () {
    beforeEach(function () {
      this.signOutDefer = this.hoodie.defer();
      spyOn(this.account, "signOut").andReturn(this.signOutDefer.promise());
    });
    it("should sign out silently", function () {
      this.account.signIn('joe@example.com', 'secret');
      expect(this.account.signOut).wasCalledWith({
        silent: true
      });
    });
    it("should downcase username", function () {
      var options, path, type, _ref;
      this.signOutDefer.resolve();
      this.account.signIn('Joe', 'secret');
      _ref = this.hoodie.request.mostRecentCall.args, type = _ref[0], path = _ref[1], options = _ref[2];
      expect(options.data.name).toBe('user/joe');
    });
    _when("signing in with current username", function () {
      beforeEach(function () {
        var _ref;
        this.account.username = 'joe@example.com';
        this.account.signIn('joe@example.com', 'secret');
        _ref = this.hoodie.request.mostRecentCall.args,
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2], _ref;
      });
      it("should not sign out", function () {
        expect(this.account.signOut).wasNotCalled();
      });
      it("should send a POST request to http://cou.ch/_session", function () {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('POST');
        expect(this.path).toBe('/_session');
      });
      _and("signIn successful", function () {
        beforeEach(function () {
          this.response = {
            "ok": true,
            "name": "user/joe@example.com",
            "roles": ["user_hash", "confirmed"]
          };
          this.requestDefer.resolve(this.response);
        });
        it("should not trigger `account:cleanup` event", function () {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.hoodie.trigger).wasNotCalledWith('account:cleanup');
        });
        it("should not trigger signin events", function () {
          expect(this.hoodie.trigger).wasNotCalledWith('account:signin', 'joe@example.com');
          expect(this.hoodie.trigger).wasNotCalledWith('account:signin:anonymous', 'joe@example.com');
        });
        it("should trigger reauthenticated event", function () {
          expect(this.hoodie.trigger).wasCalledWith('account:reauthenticated', 'joe@example.com');
        });
      });
    });
    _when("signout errors", function () {
      beforeEach(function () {
        this.signOutDefer.reject({
          reason: 'a unicorn just cried'
        });
      });
      it("should return the rejected promise", function () {
        var promise;
        promise = this.account.signOut();
        expect(promise).toBeRejectedWith({
          reason: 'a unicorn just cried'
        });
      });
    });
    _when("signout succeeds", function () {
      beforeEach(function () {
        var _ref;
        this.signOutDefer.resolve();
        this.account.signIn('joe@example.com', 'secret');
        _ref = this.hoodie.request.mostRecentCall.args,
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2], _ref;
      });
      it("should send a POST request to http://cou.ch/_session", function () {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('POST');
        expect(this.path).toBe('/_session');
      });
      it("should send username as name parameter", function () {
        expect(this.options.data.name).toBe('user/joe@example.com');
      });
      it("should send password", function () {
        expect(this.options.data.password).toBe('secret');
      });
      _and("signIn successful", function () {
        _and("account is confirmed", function () {
          beforeEach(function () {
            this.response = {
              "ok": true,
              "name": "user/joe@example.com",
              "roles": ["user_hash", "confirmed"]
            };
            this.requestDefer.resolve(this.response);
            spyOn(this.hoodie.config, "set");
            delete this.account.username;
            this.hoodie.trigger.reset();
          });
          _and("user has an anonyomous account", function () {
            beforeEach(function () {
              spyOn(this.account, "hasAnonymousAccount").andReturn(true);
            });
            it("should trigger `account:signin:anonymous` event", function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.hoodie.trigger).wasCalledWith('account:signin:anonymous', 'joe@example.com');
            });
          });
          _and("user has a manual account", function () {
            beforeEach(function () {
              spyOn(this.account, "hasAnonymousAccount").andReturn(false);
            });
            it("should trigger `account:signin` event", function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.hoodie.trigger).wasCalledWith('account:signin', 'joe@example.com');
            });
          });
          it("should set @username", function () {
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.username).toBe('joe@example.com');
            expect(this.hoodie.config.set).wasCalledWith('_account.username', 'joe@example.com');
          });
          it("should set @ownerHash", function () {
            delete this.account.ownerHash;
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.ownerHash).toBe('user_hash');
            expect(this.hoodie.config.set).wasCalledWith('_account.ownerHash', 'user_hash');
            expect(this.hoodie.config.set).wasCalledWith('createdBy', 'user_hash');
          });
          it("should fetch the _users doc", function () {
            spyOn(this.account, "fetch");
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.fetch).wasCalled();
          });
          it("should resolve with username and response", function () {
            expect(this.account.signIn('joe@example.com', 'secret')).toBeResolvedWith('joe@example.com', 'user_hash');
          });
        });
        _and("account not (yet) confirmed", function () {
          beforeEach(function () {
            this.response = {
              "ok": true,
              "name": "user/joe@example.com",
              "roles": []
            };
            this.requestDefer.resolve(this.response);
          });
          it("should reject with unconfirmed error.", function () {
            var promise;
            promise = this.account.signIn('joe@example.com', 'secret');
            expect(promise).toBeRejectedWith({
              error: "unconfirmed",
              reason: "account has not been confirmed yet"
            });
          });
        });
        _and("account has an error", function () {
          beforeEach(function () {
            var _this = this;
            this.response = {
              "ok": true,
              "name": "user/joe@example.com",
              "roles": ['error']
            };
            this.requestDefer.resolve(this.response);
            spyOn(this.account, "fetch").andCallFake(function () {
              _this.account._doc.$error = 'because you stink!';
              return _this.hoodie.defer().resolve();
            });
          });
          it("should fetch user doc without setting @username", function () {
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.fetch).wasCalledWith('joe@example.com');
            expect(this.account.username).toBeUndefined();
          });
          it("should reject with the reason", function () {
            expect(this.account.signIn('joe@example.com', 'secret')).toBeRejectedWith({
              error: 'error',
              reason: 'because you stink!'
            });
          });
        });
      });
      _when("signIn not succesful because unauthorized", function () {
        beforeEach(function () {
          this.response = {
            responseText: "{\"error\":\"unauthorized\",\"reason\":\"Name or password is incorrect.\"}"
          };
          this.requestDefer.reject(this.response);
        });
        it("should be rejected with unauthorized error", function () {
          expect(this.account.signIn('joe@example.com', 'secret')).toBeRejectedWith({
            error: "unauthorized",
            reason: "Name or password is incorrect."
          });
        });
      });
      _when("sign in without password", function () {
        it("should set password to empty string", function () {
          var data, options, path, type, _ref;
          this.account._requests = {};
          this.account.signIn('joe@example.com');
          _ref = this.hoodie.request.mostRecentCall.args,
          type = _ref[0],
          path = _ref[1],
          options = _ref[2];
          data = options.data;
          expect(data.password).toBe('');
        });
      });
    });
  });
  describe("#changePassword(currentPassword, newPassword)", function () {
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
      spyOn(this.account, "fetch").andReturn(this.fetchPromise);
      spyOn(this.account, "_now").andReturn('now');
    });
    it("should fetch the _users doc", function () {
      this.account.changePassword('currentSecret', 'newSecret');
      expect(this.account.fetch).wasCalled();
    });
    _when("fetching _users doc successful", function () {
      beforeEach(function () {
        var _ref;
        this.fetchPromise.resolve();
        this.account.changePassword('currentSecret', 'newSecret');
        _ref = this.hoodie.request.mostRecentCall.args,
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);
      });
      it("should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('PUT');
        expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });
      it("should set contentType to 'application/json'", function () {
        expect(this.options.contentType).toBe('application/json');
      });
      it("should stringify the data", function () {
        expect(typeof this.options.data).toBe('string');
      });
      it("should have set _id to 'org.couchdb.user:user/joe@example.com'", function () {
        expect(this.data._id).toBe('org.couchdb.user:user/joe@example.com');
      });
      it("should have set name to 'user/joe@example.com", function () {
        expect(this.data.name).toBe('user/joe@example.com');
      });
      it("should have set type to 'user", function () {
        expect(this.data.type).toBe('user');
      });
      it("should have updatedAt to 'now", function () {
        expect(this.data.updatedAt).toBe('now');
      });
      it("should not set createdAt to 'now", function () {
        expect(this.data.createdAt).toNotBe('now');
      });
      it("should pass password", function () {
        expect(this.data.password).toBe('newSecret');
      });
      it("should allow to set empty password", function () {
        var _ref;
        this.account.changePassword('currentSecret', '');
        _ref = this.hoodie.request.mostRecentCall.args,
        this.type = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);
        expect(this.data.password).toBe('');
      });
      it("should not send salt", function () {
        expect(this.data.salt).toBeUndefined();
      });
      it("should not send password_sha", function () {
        expect(this.data.password_sha).toBeUndefined();
      });
      _when("change password successful", function () {
        beforeEach(function () {
          this.signInDefer = this.hoodie.defer();
          spyOn(this.account, "signIn").andReturn(this.signInDefer.promise());
          this.requestDefer.resolve({
            "ok": true,
            "id": "org.couchdb.user:user/bizbiz",
            "rev": "2-345"
          });
        });
        it("should sign in", function () {
          this.account.changePassword('currentSecret', 'newSecret');
          expect(this.account.signIn).wasCalledWith('joe@example.com', 'newSecret');
        });
        _when("sign in successful", function () {
          beforeEach(function () {
            this.signInDefer.resolve();
          });
          it("should resolve its promise", function () {
            var promise;
            promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise).toBeResolved();
          });
        });
        _when("sign in not successful", function () {
          beforeEach(function () {
            this.signInDefer.reject();
          });
          it("should reject its promise", function () {
            var promise;
            promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise).toBeRejected();
          });
        });
      });
      _when("change password has an error", function () {
        beforeEach(function () {
          this.requestDefer.reject();
        });
        it("should reject its promise", function () {
          var promise;
          promise = this.account.changePassword('currentSecret', 'newSecret');
          expect(promise).toBeRejectedWith({
            error: "unknown"
          });
        });
      });
    });
    _when("fetching _users has an error", function () {
      beforeEach(function () {
        this.fetchPromise.reject();
      });
      it("should reject its promise", function () {
        var promise;
        promise = this.account.changePassword('currentSecret', 'newSecret');
        expect(promise).toBeRejectedWith({
          error: "unknown"
        });
      });
    });
  });
  describe("#signOut(options)", function () {
    beforeEach(function () {
      spyOn(this.hoodie, "uuid").andReturn('newHash');
      spyOn(this.hoodie.config, "clear");
    });
    _when("called with silent: true", function () {
      it("should not trigger `account:signout` event", function () {
        this.account.signOut({
          silent: true
        });
        expect(this.hoodie.trigger).wasNotCalledWith('account:signout');
      });
    });
    _when("user has no account", function () {
      beforeEach(function () {
        spyOn(this.account, "hasAccount").andReturn(false);
        this.promise = this.account.signOut();
      });
      it("should not send any request", function () {
        expect(this.hoodie.request).wasNotCalled();
      });
      it("should trigger `account:signout` event", function () {
        expect(this.hoodie.trigger).wasCalledWith('account:signout');
      });
      it("should generate new @ownerHash hash", function () {
        expect(this.account.ownerHash).toBe('newHash');
      });
      it("should unset @username", function () {
        expect(this.account.username).toBeUndefined();
      });
      it("should clear config", function () {
        expect(this.hoodie.config.clear).wasCalled();
      });
      it("should return a resolved promise", function () {
        expect(this.promise).toBePromise();
        expect(this.promise).toBeResolved();
      });
    });
    _when("user has account", function () {
      beforeEach(function () {
        var _ref;
        spyOn(this.hoodie.remote, "disconnect");
        spyOn(this.account, "hasAccount").andReturn(true);
        this.account.signOut();
        _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should disconnect", function () {
        expect(this.hoodie.remote.disconnect).wasCalled();
      });
      it("should send a DELETE request to http://cou.ch/_session", function () {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('DELETE');
        expect(this.path).toBe('/_session');
      });
      _when("signOut request successful", function () {
        beforeEach(function () {
          this.requestDefer.resolve();
          this.account.signOut();
        });
        it("should trigger `account:signout` event", function () {
          expect(this.hoodie.trigger).wasCalledWith('account:signout');
        });
        it("should generate new @ownerHash hash", function () {
          expect(this.account.ownerHash).toBe('newHash');
        });
        it("should unset @username", function () {
          expect(this.account.username).toBeUndefined();
        });
        it("should clear config", function () {
          expect(this.hoodie.config.clear).wasCalled();
        });
      });
    });
  });
  describe("#hasAccount()", function () {
    _when("#username is undefined", function () {
      beforeEach(function () {
        delete this.account.username;
      });
      it("should return false", function () {
        expect(this.account.hasAccount()).toBe(false);
      });
    });
    _when("#username is set", function () {
      beforeEach(function () {
        this.account.username = 'somebody';
        this.account.username;
      });
      it("should return false", function () {
        expect(this.account.hasAccount()).toBe(true);
      });
    });
  });
  describe("#hasAnonymousAccount()", function () {
    _when("_account.anonymousPassword is set", function () {
      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andCallFake(function (key) {
          if (key === '_account.anonymousPassword') {
            return 'password';
          }
        });
      });
      it("should return true", function () {
        expect(this.account.hasAnonymousAccount()).toBe(true);
      });
    });
    _when("_account.anonymousPassword is not set", function () {
      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andCallFake(function (key) {
          if (key === '_account.anonymousPassword') {
            return undefined;
          }
        });
      });
      it("should return false", function () {
        expect(this.account.hasAnonymousAccount()).toBe(false);
      });
    });
  });
  describe("#on(event, callback)", function () {
    beforeEach(function () {
      spyOn(this.hoodie, "on");
    });
    it("should proxy to @hoodie.on() and namespace with account", function () {
      var party;
      party = jasmine.createSpy('party');
      this.account.on('funky', party);
      expect(this.hoodie.on).wasCalledWith('account:funky', party);
    });
    it("should namespace multiple events correctly", function () {
      var cb;
      cb = jasmine.createSpy('test');
      this.account.on('super funky fresh', cb);
      expect(this.hoodie.on).wasCalledWith('account:super account:funky account:fresh', cb);
    });
  });
  describe("#db()", function () {
    _when("account.ownerHash is 'owner_hash123'", function () {
      beforeEach(function () {
        this.account.ownerHash = 'owner_hash123';
        this.account.ownerHash;
      });
      it("should return 'joe$example.com", function () {
        (expect(this.account.db())).toEqual('user/owner_hash123');
      });
    });
  });
  describe("#fetch()", function () {
    _when("username is not set", function () {
      beforeEach(function () {
        this.account.username = null;
        this.account.fetch();
      });
      it("should not send any request", function () {
        expect(this.hoodie.request).wasNotCalled();
      });
    });
    _when("username is joe@example.com", function () {
      beforeEach(function () {
        var _ref;
        this.account.username = 'joe@example.com';
        this.account.fetch();
        _ref = this.hoodie.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should send a GET request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
        expect(this.hoodie.request).wasCalled();
        expect(this.type).toBe('GET');
        expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });
      _when("successful", function () {
        beforeEach(function () {
          this.response = {
            "_id": "org.couchdb.user:baz",
            "_rev": "3-33e4d43a6dff5b29a4bd33f576c7824f",
            "name": "baz",
            "salt": "82163606fa5c100e0095ad63598de810",
            "password_sha": "e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e",
            "type": "user",
            "roles": []
          };
          this.requestDefer.resolve(this.response);
        });
        it("should resolve its promise", function () {
          var promise;
          promise = this.account.fetch();
          expect(promise).toBeResolvedWith(this.response);
        });
      });
      _when("fails", function () {
        beforeEach(function () {
          this.error = {
            error: 'ErrorName',
            reason: 'ErrorReason'
          };
          this.requestDefer.reject(this.error);
        });
        it("should resolve its promise", function () {
          var promise;
          promise = this.account.fetch();
          expect(promise).toBeRejectedWith(this.error);
        });
      });
    });
  });
  describe("#destroy()", function () {
    beforeEach(function () {
      this.fetchDefer = this.hoodie.defer();
      spyOn(this.hoodie.remote, "disconnect");
      spyOn(this.hoodie.config, "clear");
      spyOn(this.hoodie.config, "set");
      spyOn(this.account, "fetch").andReturn(this.fetchDefer.promise());
      spyOn(this.hoodie, "uuid").andReturn('newHash');
      this.account.username = 'joe@example.com';
      this.account._doc = {
        _rev: '1-234'
      };
    });
    _when("user has account", function () {
      beforeEach(function () {
        spyOn(this.account, "hasAccount").andReturn(true);
      });
      _and("fetch is successful", function () {
        beforeEach(function () {
          this.fetchDefer.resolve();
        });
        it("should return a promise", function () {
          expect(this.account.destroy()).toBePromise();
        });
        it("should disconnect", function () {
          this.account.destroy();
          expect(this.hoodie.remote.disconnect).wasCalled();
        });
        it("should fetch the account", function () {
          this.account.destroy();
          expect(this.account.fetch).wasCalled();
        });
        it("should send a PUT request to /_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
          this.account.destroy();
          expect(this.hoodie.request).wasCalledWith('PUT', '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', {
            data: JSON.stringify({
              _rev: '1-234',
              _deleted: true
            }),
            contentType: 'application/json'
          });
        });
        _and("destroy request succesful", function () {
          beforeEach(function () {
            this.requestDefer.resolve();
            this.account.destroy();
          });
          it("should unset @username", function () {
            expect(this.account.username).toBeUndefined();
          });
          it("should regenerate @ownerHash", function () {
            expect(this.account.ownerHash).toBe('newHash');
          });
          it("should trigger signout event", function () {
            expect(this.hoodie.trigger).wasCalledWith('account:signout');
          });
          it("should clear config", function () {
            expect(this.hoodie.config.clear).wasCalled();
          });
          it("should set config._account.ownerHash to new @ownerHash", function () {
            expect(this.hoodie.config.set).wasCalledWith('_account.ownerHash', 'newHash');
          });
          it("should trigger clenaup event", function() {
            expect(this.hoodie.trigger).wasCalledWith('account:cleanup');
          });
        });
      });
      _and("fetch fails with not_found", function () {
        beforeEach(function () {
          this.error = {
            error: "not_found",
            reason: "missing"
          };
          this.fetchDefer.reject(this.error);
          this.promise = this.account.destroy();
          this.promise;
        });
        it("should resolve anyway", function () {
          expect(this.promise).toBeResolved();
        });
      });
      _and("fetch fails with unknown error", function () {
        beforeEach(function () {
          this.error = {
            error: "unknown"
          };
          this.fetchDefer.reject(this.error);
          this.promise = this.account.destroy();
          this.promise;
        });
        it("should reject", function () {
          expect(this.promise).toBeRejectedWith(this.error);
        });
        it("should not unset @username", function () {
          expect(this.account.username).toBe('joe@example.com');
        });
        it("should not regenerate @ownerHash", function () {
          expect(this.account.ownerHash).toBe('uuid');
        });
        it("should not trigger signout event", function () {
          expect(this.hoodie.trigger).wasNotCalledWith('account:signout');
        });
        it("should not clear config", function () {
          expect(this.hoodie.config.clear).wasNotCalled();
        });
      });
    });
    _when("user has no account", function () {
      beforeEach(function () {
        spyOn(this.account, "hasAccount").andReturn(false);
        this.promise = this.account.destroy();
      });
      it("should return a promise", function () {
        expect(this.promise).toBePromise();
      });
      it("should not try to fetch", function () {
        expect(this.account.fetch).wasNotCalled();
      });
      it("should unset @username", function () {
        expect(this.account.username).toBeUndefined();
      });
      it("should regenerate @ownerHash", function () {
        expect(this.account.ownerHash).toBe('newHash');
      });
      it("should trigger signout event", function () {
        expect(this.hoodie.trigger).wasCalledWith('account:signout');
      });
      it("should clear config", function () {
        expect(this.hoodie.config.clear).wasCalled();
      });
      it("should set config._account.ownerHash to new @ownerHash", function () {
        expect(this.hoodie.config.set).wasCalledWith('_account.ownerHash', 'newHash');
      });
    });
  });
  describe("#resetPassword(username)", function () {
    beforeEach(function () {
      spyOn(this.account, "_checkPasswordResetStatus").andReturn("checkPasswordResetPromise");
    });
    _when("there is a pending password reset request", function () {
      beforeEach(function () {
        spyOn(this.hoodie.config, "get").andReturn("joe/uuid567");
        this.account.resetPassword();
      });
      it("should not send another request", function () {
        expect(this.hoodie.request).wasNotCalled();
      });
      it("should check for the status of the pending request", function () {
        expect(this.account._checkPasswordResetStatus).wasCalled();
      });
      it("should return the promise by the status request", function () {
        expect(this.account.resetPassword()).toBe('checkPasswordResetPromise');
      });
    });
    _when("there is no pending password reset request", function () {
      beforeEach(function () {
        var _ref;
        spyOn(this.hoodie.config, "get").andReturn(void 0);
        spyOn(this.hoodie.config, "set");
        spyOn(this.account, "_now").andReturn('now');
        spyOn(this.hoodie, "uuid").andReturn('uuid567');
        this.account.resetPassword("joe@example.com");
        _ref = this.hoodie.request.mostRecentCall.args,
        this.method = _ref[0],
        this.path = _ref[1],
        this.options = _ref[2];
        this.data = JSON.parse(this.options.data);
      });
      it("should generate a reset Password Id and store it locally", function () {
        expect(this.hoodie.config.set).wasCalledWith("_account.resetPasswordId", "joe@example.com/uuid567");
      });
      it("should send a PUT request to /_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567", function () {
        expect(this.method).toBe('PUT');
        expect(this.path).toBe('/_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567');
      });
      it("should send data with contentType 'application/json'", function () {
        expect(this.options.contentType).toBe('application/json');
      });
      it("should send a new _users object", function () {
        expect(this.data._id).toBe('org.couchdb.user:$passwordReset/joe@example.com/uuid567');
        expect(this.data.name).toBe("$passwordReset/joe@example.com/uuid567");
        expect(this.data.type).toBe('user');
        expect(this.data.password).toBe('joe@example.com/uuid567');
        expect(this.data.createdAt).toBe('now');
        expect(this.data.updatedAt).toBe('now');
      });
      it("should return a promise", function () {
        expect(this.account.resetPassword("joe@example.com")).toBePromise();
      });
      _when("reset Password request successful", function () {
        beforeEach(function () {
          this.promiseSpy = jasmine.createSpy('promiseSpy');
          this.account._checkPasswordResetStatus.andReturn({
            then: this.promiseSpy
          });
          this.requestDefer.resolve();
        });
        it("should check for the request status", function () {
          this.account.resetPassword('joe@example.com');
          expect(this.account._checkPasswordResetStatus).wasCalled();
        });
        it("should be resolved", function () {
          expect(this.account.resetPassword('joe@example.com')).toBeResolved();
        });
      });
      _when("reset Password request is not successful", function () {
        beforeEach(function () {
          this.requestDefer.reject({
            responseText: '{"error": "ooops"}'
          });
        });
        it("should be rejected with the error", function () {
          expect(this.account.resetPassword('joe@example.com')).toBeRejectedWith({
            error: 'ooops'
          });
        });
      });
    });
  });


  describe("#resetPassword(username)", function () {
    it("should proxy to hoodie.trigger", function() {
      this.account.trigger('say', 'funky', 'fresh')
      expect(this.hoodie.trigger).wasCalledWith('account:say', 'funky', 'fresh');
    });

  });

  describe("#changeUsername(currentPassword, newUsername)", function () {
    beforeEach(function () {
      var signInDefers;
      this.signInDefer1 = this.hoodie.defer();
      this.signInDefer2 = this.hoodie.defer();
      signInDefers = [this.signInDefer1, this.signInDefer2];
      spyOn(this.account, "_sendSignInRequest").andCallFake(function () {
        return signInDefers.shift();
      });
      this.fetchDefer = this.hoodie.defer();
      spyOn(this.account, "fetch").andReturn(this.fetchDefer);
      spyOn(this.account, "_now").andReturn('now');
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
    it("should return a promise", function () {
      this.account.changeUsername('secret', 'new.joe@example.com');
      expect(this.account.changeUsername()).toBePromise();
    });
    it("should downcase new username", function () {
      spyOn(this.account, "_changeUsernameAndPassword");
      this.account.changeUsername('secret', 'Joe');
      expect(this.account._changeUsernameAndPassword).wasCalledWith('secret', 'joe');
    });
    _when("sign in successful", function () {
      beforeEach(function () {
        this.signInDefer1.resolve('joe@example.com');
      });
      it("should fetch the _users doc", function () {
        this.account.changeUsername('secret', 'new.joe@example.com');
        expect(this.account.fetch).wasCalled();
      });
      _and("_users doc can be fetched", function () {
        beforeEach(function () {
          var _ref;
          this.fetchDefer.resolve();
          this.account.username = 'joe@example.com';
          this.promise = this.account.changeUsername('secret', 'new.joe@example.com');
          _ref = this.hoodie.request.mostRecentCall.args,
          this.type = _ref[0],
          this.path = _ref[1],
          this.options = _ref[2];
          this.data = JSON.parse(this.options.data);
        });
        it("should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", function () {
          expect(this.hoodie.request).wasCalled();
          expect(this.type).toBe('PUT');
          expect(this.path).toBe('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
        });
        it("should set contentType to 'application/json'", function () {
          expect(this.options.contentType).toBe('application/json');
        });
        it("should stringify the data", function () {
          expect(typeof this.options.data).toBe('string');
        });
        it("should have set name to 'user/joe@example.com", function () {
          expect(this.data.$newUsername).toBe('new.joe@example.com');
        });
        it("should have set updatedAt to 'now", function () {
          expect(this.data.updatedAt).toBe('now');
        });
        it("should not set createdAt to 'now", function () {
          expect(this.data.createdAt).toNotBe('now');
        });
        _when("_users doc could be updated", function () {
          beforeEach(function () {
            spyOn(this.hoodie.remote, "disconnect");
            this.requestDefer.resolve();
          });
          it("should disconnect", function () {
            expect(this.hoodie.remote.disconnect).wasCalled();
          });
          it("should sign in with new username", function () {
            expect(this.account._sendSignInRequest).wasCalledWith('new.joe@example.com', 'secret');
          });
          _and("signIn is successful", function () {
            beforeEach(function () {
              this.signInDefer2.resolve('fuckyeah');
            });
            it("should be resolved", function () {
              expect(this.promise).toBeResolvedWith('fuckyeah');
            });
          });
          _but("signIn has an error", function () {
            beforeEach(function () {
              this.signInDefer2.reject({
                error: 'oops'
              });
            });
            it("should be resolved", function () {
              expect(this.promise).toBeRejectedWith({
                error: 'oops'
              });
            });
          });
        });
        _when("_users doc could not be updated", function () {
          beforeEach(function () {
            this.requestDefer.reject();
          });
          it("should be rejected", function () {
            expect(this.promise).toBeRejectedWith({
              error: 'unknown'
            });
          });
        });
      });
      _but("_users doc cannot be fetched", function () {
        beforeEach(function () {
          this.fetchDefer.reject({
            error: 'something'
          });
        });
        it("should be rejected", function () {
          var promise;
          promise = this.account.changeUsername('secret', 'new.joe@example.com');
          expect(promise).toBeRejectedWith({
            error: 'something'
          });
        });
      });
    });
    _when("signIn not successful", function () {
      beforeEach(function () {
        this.signInDefer1.reject({
          error: 'autherror'
        });
      });
      it("should be rejected", function () {
        var promise;
        promise = this.account.changeUsername('secret', 'new.joe@example.com');
        expect(promise).toBeRejectedWith({
          error: 'autherror'
        });
      });
    });
  });
});

