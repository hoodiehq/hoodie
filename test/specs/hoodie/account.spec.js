require('../../lib/setup');

var hoodieAccount = require('../../../src/hoodie/account');

describe('hoodie.account', function () {

  beforeEach(function () {
    localStorage.clear();

    this.noop = function () {};

    this.hoodie = this.MOCKS.hoodie.apply(this);

    // for more sophisticated request stubbing
    this.requestDefers = [];
    this.fakeRequest = function() {
      var defer = this.hoodie.defer();
      var promise = defer.promise();
      this.requestDefers.push(defer);
      promise.abort = this.noop;
      return promise;
    }.bind(this);

    this.clock = this.sandbox.useFakeTimers(0); // '1970-01-01 00:00:00'

    hoodieAccount(this.hoodie);
    this.account = this.hoodie.account;
    $.extend(this.account, this.MOCKS.events.apply(this));

    this.account.username = undefined; // 'joe@example.com';

    this.hoodie.id.returns('hash123');
  });

  describe('#authenticate()', function () {

    beforeEach(function() {
      this.sandbox.stub(this.account, 'request').returns(this.hoodie.request());
    });

    _when('user is logged in as joe@example.com', function() {
      beforeEach(function () {
        this.account.username = 'joe@example.com';
      });

      _and('session has not been validated yet', function () {

        it('should return a promise', function () {
          expect(this.account.authenticate()).to.be.promise();
        });

        it('should send a GET /_session', function () {
          this.account.authenticate();
          expect(this.account.request).to.be.calledWith('GET', '/_session');
        });

        it('should not send multiple GET /_session requests', function () {
          this.account.authenticate();
          this.account.authenticate();

          expect(this.account.request.calledOnce).to.be.ok();
        });

        _and('there is a pending singIn request', function () {

          beforeEach(function () {
            this.signInPromise = this.hoodie.account.signIn('joe@example.com', 'secret');
            expect(this.signInPromise).to.be.pending();
          });

          it('should be rejected when it is pending and then fails', function () {
            var promise = this.account.authenticate();
            this.hoodie.request.defer.reject();

            expect(promise).to.be.rejected();
          });

          it('should be resolved when it is pending and then succeeds', function () {
            var promise = this.account.authenticate();
            this.hoodie.request.defer.resolve({
              name: 'joe@example.com',
              roles: ['hash123', 'confirmed']
            });

            expect(promise).to.be.resolved();
          });
        });

        _when('there is a pending singOut request', function () {

          beforeEach(function () {
            this.hoodie.remote.disconnect.defer.resolve();
            this.signOutPromise = this.hoodie.account.signOut();
            expect(this.signOutPromise).to.be.pending();
          });

          it('should be rejected when it is pending and then fails', function () {
            var promise = this.account.authenticate();
            this.hoodie.request.defer.reject();

            expect(promise).to.be.rejected();
          });

          it('should be rejected anyway, even if the pending request succeeds', function () {
            var promise = this.account.authenticate();
            this.hoodie.request.defer.resolve();

            expect(promise).to.be.rejected();
          });

        });

        _and('authentication request is successful', function () {
          _and('returns a valid session for joe@example.com', function () {
            beforeEach(function () {
              this.hoodie.request.defer.resolve(validSessionResponse());
              this.promise = this.account.authenticate();
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
              // because it's already 'joe@example.com'
              expect(this.hoodie.config.set).to.not.be.calledWith('_account.username', 'joe@example.com');
            });
          }); // returns valid session info for joe@example.com

          //
          _but('session is invalid', function () {
            beforeEach(function () {
              this.hoodie.request.defer.resolve( invalidSessionResponse() );
              this.promise = this.account.authenticate();
            });

            it('should reject the promise', function () {
              expect(this.promise.state()).to.eql('rejected');
            });

            it('should trigger an `error:unauthenticated` event', function () {
              expect(this.account.trigger).to.be.calledWith('error:unauthenticated');
            });
          }); // session is invalid
        }); // authentication request is successful and


        //
        _when('authentication request has an error', function () {
          beforeEach(function () {
            this.hoodie.request.defer.reject({
              name: 'SomeError'
            });
            this.promise = this.account.authenticate();
          });

          it('should reject the promise', function () {
            expect(this.promise).to.be.rejectedWith({ name: 'SomeError' });
          });
        }); // authentication request has an error
      }); // has not been authenticated yet

      with_session_validated_before( function () {
        beforeEach(function () {
          this.promise = this.account.authenticate();
        });

        it('should return a promise', function () {
          expect(this.promise).to.be.promise();
        });

        it('should resolve the promise', function () {
          expect(this.promise).to.be.resolvedWith('joe@example.com');
        });

        it('should not send any farther requests', function() {
          expect(this.account.request).to.not.be.called();
        });
      }); // with_session_validated_before

      with_session_invalidated_before( function () {
        beforeEach(function () {
          this.promise = this.account.authenticate();
        });

        it('should return a promise', function () {
          expect(this.promise).to.be.promise();
        });

        it('should reject the promise', function () {
          expect(this.promise).to.be.rejected();
        });
      }); // with_session_invalidated_before
    }); // user is logged in as joe@example.com (hash: 'hash123')

    _when('user has an anonymous account', function() {
      beforeEach(function () {
        this.account.username = 'randomhash';

        // NOTE:
        // I do not understand, why we have to resetBehavior here.
        this.hoodie.config.get.resetBehavior();

        this.hoodie.config.get.returns('randomPassword');
        this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(true);
        this.sandbox.stub(this.account, 'signIn').returns('signIn_promise');
      });

      //
      _and('has not been authenticated yet', function () {
        _when('authentication request is successful but session is not valid', function () {

          // which means the user has no valid session
          beforeEach(function () {
            this.hoodie.request.defer.resolve(invalidSessionResponse());
            this.promise = this.account.authenticate();
          });

          it('should sign in in the background, as we know the password anyway', function () {
            expect(this.account.signIn.args[0]).to.eql(['randomhash', 'randomPassword']);
          });

          it('should return the promise of the sign in request', function () {
            expect(this.promise).to.be.resolvedWith('signIn_promise');
          });
        });
      }); // authentication request is successful and returns `name: null`
    }); // user has an anonymous account

    _when('user has no account', function () {
      beforeEach(function() {
        delete this.account.username;
      });

      it('should send a sign out request, but not cleanup', function () {
        this.account.authenticate();
        expect(this.account.request).to.be.calledWith('DELETE', '/_session');
      });

      _and('signOut succeeds', function () {
        beforeEach(function () {
          this.hoodie.request.defer.resolve();
        });

        it('should return a rejected promise', function () {
          expect(this.account.authenticate()).to.be.rejected();
        });
      });

      _and('signOut fails', function () {
        beforeEach(function () {
          this.hoodie.request.defer.reject();
        });

        it('should return a rejected promise', function () {
          expect(this.account.authenticate()).to.be.rejected();
        });
      });
    });
  }); // # authenticate


  describe('#hasInvalidSession', function() {
    beforeEach(function() {
      this.sandbox.stub(this.account, 'request').returns(this.hoodie.request());
    });

    _when('user has no account', function() {
      beforeEach(function() {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
      });

      it('returns false', function() {
        expect(this.account.hasInvalidSession()).to.be(false);
      });
    });

    _when('user has account', function() {
      beforeEach(function() {
        this.sandbox.stub(this.account, 'hasAccount').returns(true);
      });

      _and('session has not been validated yet', function () {
        it('returns false', function() {
          expect(this.account.hasInvalidSession()).to.be(false);
        });
      });

      with_session_validated_before( function () {
        it('returns false', function() {
          expect(this.account.hasInvalidSession()).to.be(false);
        });
      }); // with_session_validated_before

      with_session_invalidated_before( function () {
        it('returns true', function() {
          expect(this.account.hasInvalidSession()).to.be(true);
        });
      }); // with_session_invalidated_before
    });
  });


  describe('#hasValidSession', function() {
    beforeEach(function() {
      this.sandbox.stub(this.account, 'request').returns(this.hoodie.request());
    });

    _when('user has no account', function() {
      beforeEach(function() {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
      });

      it('returns false', function() {
        expect(this.account.hasValidSession()).to.be(false);
      });
    });

    _when('user has account', function() {
      beforeEach(function() {
        this.sandbox.stub(this.account, 'hasAccount').returns(true);
      });

      _and('session has not been validated yet', function () {
        it('returns false', function() {
          expect(this.account.hasValidSession()).to.be(false);
        });
      });

      with_session_validated_before( function () {
        it('returns true', function() {
          expect(this.account.hasValidSession()).to.be(true);
        });
      }); // with_session_validated_before

      with_session_invalidated_before( function () {
        it('returns false', function() {
          expect(this.account.hasValidSession()).to.be(false);
        });
      }); // with_session_invalidated_before
    });
  });


  describe('#signUp(username, password)', function () {

    beforeEach(function () {
      this.sandbox.stub(this.account, 'request', this.fakeRequest);
    });

    _when('username not set', function () {

      beforeEach(function () {
        this.promise = this.account.signUp('', 'secret', {
          name: 'Joe Doe'
        });
      });

      it('should be rejected', function () {
        this.promise.then(this.noop, function (res) {
          expect(res).to.eql( 'Username must be set.' );
        });
      });

    }); // username not set

    _when('username set', function () {

      it('should downcase it', function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
        this.account.signUp('Joe', 'secret');

        var args = this.account.request.args[0];
        this.type = args[0],
        this.path = args[1],
        this.options = args[2];

        expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe');
      });

      _and('user has an anonmyous account', function () {

        beforeEach(function () {

          this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(true);
          this.fetchDefer = this.hoodie.defer();
          this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer.promise());

          // NOTE:
          // I do not understand, why we have to resetBehavior here.
          this.hoodie.config.get.resetBehavior();

          this.hoodie.config.get.returns('randomPassword');
          this.account.username = 'randomUsername';

          this.promise = this.account.signUp('joe@example.com', 'secret', {
            name: 'Joe Doe'
          });
        });

        it('should sign in', function () {

          // because it need to authenticate for the current account
          // first, before 'signing up' for a real account, wich is
          // technically a username change
          expect(this.account.request).to.be.calledWith('POST', '/_session', {
            'data': {
              'name': 'user/randomUsername',
              'password': 'randomPassword'
            }
          });
        });

        _when('sign in successful', function () {

          beforeEach(function () {
            this.requestDefers[0].resolve({
              name : 'randomUsername',
              roles : ['randomhash', 'confirmed']
            });
            this.account.hasAnonymousAccount.returns(false);
          });

          it('should fetch the _users doc', function () {
            expect(this.account.fetch).to.be.called();
          });

          _when('fetching user doc successful', function () {

            beforeEach(function () {
              this.fetchDefer.resolve();

              var args = this.account.request.args[1];
              this.type = args[0],
              this.path = args[1],
              this.options = args[2];
              this.data = JSON.parse(this.options.data);
            });

            it('should send a PUT request to http://my.hood.ie/_users/org.couchdb.user%3Auser%2FrandomUsername', function () {
              expect(this.account.request).to.be.called();
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
              expect(this.data.updatedAt).to.eql( now() );
            });

            it('should have set signedUpAt to now', function () {
              expect(this.data.signedUpAt).to.eql( now() );
            });

            _when('_users doc could be updated', function () {

              beforeEach(function () {
                this.requestDefers[1].resolve();

                // send sign in request which is delayed by 300ms
                this.clock.tick(300);
              });

              it('should hoodie.remote.disconnect', function () {
                expect(this.hoodie.remote.disconnect).to.be.called();
              });

              it('should sign in with new username', function () {

                var args = this.account.request.args[2];
                var type = args[0];
                var path = args[1];
                var options = args[2];
                var data = options.data;

                var username = 'joe@example.com';
                var password = 'secret';

                expect(type).to.eql('POST');
                expect(path).to.eql('/_session');
                expect(data.name).to.eql( 'user/' + username );
                expect(data.password).to.eql( password );
              });

              _and('signIn is successful', function () {

                beforeEach(function () {
                  this.requestDefers[2].resolve({
                    name : 'joe@example.com',
                    roles : ['randomhash', 'confirmed']
                  });
                });

                it('should be resolved', function () {
                  expect(this.promise).to.be.resolvedWith('joe@example.com', 'randomhash');
                });

              });

              _but('signIn has an error', function () {

                beforeEach(function () {
                  this.requestDefers[2].reject({
                    name: 'HoodieError',
                    message: 'Oops'
                  });
                });

                it('should be resolved', function () {
                  expect(this.promise).to.be.rejectedWith({
                    name: 'HoodieError',
                    message: 'Oops'
                  });
                });

              }); // signIn has an error

            }); // _users doc could be updated

            _when('_users doc could not be updated', function () {

              beforeEach(function () {
                this.hoodie.request.defer.reject();
              });

              it('should be rejected', function () {
                this.promise.then(this.noop, function (res) {
                  expect(res).to.eql({
                    name: 'HoodieError'
                  });
                });
              });

            }); // _users doc could not be updated

          }); // fetching user doc successful

          _when('fetching user doc not successful', function () {

            beforeEach(function () {
              this.fetchDefer.reject({
                name: 'HoodieError'
              });
            });

            it('should be rejected', function () {
              this.promise.then(this.noop, function (res) {
                expect(res).to.eql({
                  name: 'HoodieError'
                });
              });
            });
          }); // fetching user doc not successful
        }); // sign in successful
      }); // user has an anonmyous account

      _but('user is already logged in', function () {
        beforeEach(function () {
          this.sandbox.stub(this.account, 'hasAccount').returns(true);
        });

        it('should be rejected', function () {
          var promise = this.account.signUp('joe@example.com', 'secret');

          expect(promise).to.be.rejectedWith('Must sign out first.');
        });
      }); // user is already logged in

      _and('user is logged out', function () {

        beforeEach(function () {
          this.sandbox.stub(this.account, 'hasAccount').returns(false);
          this.account.signUp('joe@example.com', 'secret');

          var args = this.account.request.args[0];
          this.type = args[0],
          this.path = args[1],
          this.options = args[2];
          this.data = JSON.parse(this.options.data);
        });

        it('should send a PUT request to http://my.hood.ie/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          expect(this.account.request).to.be.called();
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

        it('should have set database to \'user/hash123\'', function () {
          expect(this.data.database).to.eql('user/hash123');
        });

        it('should have set createdAt & updatedAt to now', function () {
          expect(this.data.createdAt).to.eql( now() );
          expect(this.data.updatedAt).to.eql( now() );
        });

        it('should have set signedUpAt to now', function () {
          expect(this.data.signedUpAt).to.eql( now() );
        });

        it('should allow to signup without password', function () {
          this.account.signUp('joe@example.com');
          var args = this.account.request.args.pop();

          this.type = args[0],
          this.path = args[1],
          this.options = args[2];
          this.data = JSON.parse(this.options.data);

          expect(this.data.password).to.eql('');
        });

        _when('signUp is anonymous', function () {

          beforeEach(function () {
            var options, path, promise, type;

            // reset spies
            this.account.request.reset();
            this.requestDefers = [];

            //
            promise = this.account.signUp( this.hoodie.id() , 'secret');

            var args = this.account.request.args[0];
            type = args[0],
            path = args[1],
            options = args[2];
            this.data = JSON.parse(options.data);
          });

          it('should not set signedUpAt if signed up anonymously', function () {
            expect(this.data.signedUpAt).to.eql(void 0);
          });

          it('should have set name to \'user_anonymous/hash123\'', function () {
            expect(this.data.name).to.eql('user_anonymous/hash123');
          });

        });

        _when('signUp successful', function () {

          beforeEach(function () {

            // reset spies
            this.account.request.reset();
            this.requestDefers = [];

            //
            this.promise = this.account.signUp('joe@example.com', 'secret');
            var response = {
              'ok': true,
              'id': 'org.couchdb.user:bizbiz',
              'rev': '1-a0134f4a9909d3b20533285c839ed830'
            };

            this.requestDefers[0].resolve(response);
            this.clock.tick(300); // do the delayed sign in
          });

          it('should trigger `signup` event', function () {
            expect(this.account.trigger).to.be.calledWith('signup', 'joe@example.com');
          });

          it('should sign in', function () {
            var args = this.account.request.args[1];
            var type = args[0];
            var path = args[1];

            expect(type).to.eql('POST');
            expect(path).to.eql('/_session');
          });

          _and('signIn successful', function () {

            beforeEach(function () {
              this.requestDefers[1].resolve({
                name: 'joe@example.com',
                roles: ['hash123', 'confirmed']
              });
            });

            it('should resolve its promise', function () {
              expect(this.promise).to.be.resolvedWith('joe@example.com', 'hash123');
            });
          }); // signIn successful

          _and('signIn not successful', function () {

            beforeEach(function () {
              this.requestDefers[1].reject({
                name: 'HoodieError',
                message: 'This is so'
              });
            });

            it('should resolve its promise', function () {
              expect(this.promise).to.be.rejectedWith({
                name: 'HoodieError',
                message: 'This is so'
              });
            });

          }); // signIn not successful

        }); // signUp successful

        _when('signUp has a conflict error', function () {
          beforeEach(function() {
            this.promise = this.account.signUp('exists@example.com', 'secret');
            this.requestDefers.pop().reject({
              name: 'HoodieConflictError',
              message: 'Document update conflict'
            });
          });

          it('should reject its promise', function () {
            this.promise.then(this.noop, function (res) {
              expect(res).to.eql({
                name: 'HoodieConflictError',
                message: 'Username exists@example.com already exists'
              });
            });
          });
        }); // signUp has an error

        _when('signUp has a generic error', function () {

          beforeEach(function () {
            this.promise = this.account.signUp('exists@example.com', 'secret');
            this.requestDefers.pop().reject({
              name: 'HoodieRequestError',
              message: 'You stink'
            });
          });

          it('should reject its promise', function () {
            this.promise.then(this.noop, function (res) {
              expect(res).to.eql({
                name: 'HoodieRequestError',
                message: 'You stink'
              });
            });
          });
        }); // signUp has an error
      }); // user is logged out
    }); // username set
  }); // #signUp

  describe('#anonymousSignUp()', function () {

    beforeEach(function () {
      this.signUpDefer = this.hoodie.defer();

      this.sandbox.stub(this.account, 'signUp').returns(this.signUpDefer.promise());
    });

    it('should sign up with username = hoodie.id() and the random password', function () {
      this.account.anonymousSignUp();
      expect(this.account.signUp).to.be.calledWith( 'hash123' , 'uuid123');
    });

    _when('signUp successful', function () {

      beforeEach(function () {
        this.signUpDefer.resolve();
      });

      it('should generate a password and store it locally in _account.anonymousPassword', function () {
        this.account.anonymousSignUp();
        expect(this.hoodie.generateId).to.be.calledWith(10);
        expect(this.hoodie.config.set).to.be.calledWith('_account.anonymousPassword', 'uuid123');
      });
    });
  }); // #anonymousSignUp

  describe('#signIn(username, password)', function () {

    beforeEach(function () {
      this.signOutDefer = this.hoodie.defer();
      this.sandbox.stub(this.account, 'signOut').returns(this.signOutDefer.promise());
    });

    it('should sign out silently', function () {
      this.account.signIn('joe@example.com', 'secret');
      expect(this.account.signOut).to.be.calledWith({
        silent: true
      });
    });

    it('should downcase username', function () {
      var options, path, type, args;
      this.signOutDefer.resolve();
      this.account.signIn('Joe', 'secret');
      args = this.hoodie.request.args[0],
      type = args[0],
      path = args[1],
      options = args[2];

      expect(options.data.name).to.eql('user/joe');
    });

    _when('signing in with current username', function () {

      beforeEach(function () {
        var args;
        this.account.username = 'joe@example.com';
        this.account.signIn('joe@example.com', 'secret');
        args = this.hoodie.request.args[0],
        this.type = args[0],
        this.path = args[1],
        this.options = args[2];
      });

      it('should not sign out', function () {
        expect(this.account.signOut).to.not.be.called();
      });

      it('should send a POST request to http://my.hood.ie/_session', function () {
        expect(this.hoodie.request).to.be.called();
        expect(this.type).to.eql('POST');
        expect(this.path).to.eql('/_session');
      });

      _and('signIn successful', function () {

        beforeEach(function () {
          this.response = {
            'ok': true,
            'name': 'user/joe@example.com',
            'roles': ['hash123', 'confirmed']
          };
          this.hoodie.request.defer.resolve(this.response);
        });

        it('should not trigger `cleanup` event', function () {
          this.account.signIn('joe@example.com', 'secret');
          expect(this.account.trigger).to.not.be.calledWith('cleanup');
        });

        it('should not trigger signin events', function () {
          expect(this.account.trigger).to.not.be.calledWith('signin', 'joe@example.com');
          expect(this.account.trigger).to.not.be.calledWith('signin:anonymous', 'joe@example.com');
        });

        it('should trigger reauthenticated event', function () {
          expect(this.account.trigger).to.be.calledWith('reauthenticated', 'joe@example.com');
        });

      }); // signIn successful
    }); // signing in with current username

    _when('signout errors', function () {

      beforeEach(function () {
        this.signOutDefer.reject({
          name: 'HoodieError',
          message: 'a unicorn just cried'
        });
      });

      it('should return the rejected promise', function () {
        var promise = this.account.signOut();

        promise.then(this.noop, function (res) {
          expect(res).to.eql({
            name: 'HoodieError',
            message: 'a unicorn just cried'
          });
        });

      });
    }); // signout errors

    _when('signout succeeds', function () {

      beforeEach(function () {
        var args;
        this.signOutDefer.resolve();
        this.account.signIn('joe@example.com', 'secret');

        args = this.hoodie.request.args[0],
        this.type = args[0],
        this.path = args[1],
        this.options = args[2];
      });

      it('should send a POST request to http://my.hood.ie/_session', function () {
        expect(this.hoodie.request).to.be.called();
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
              'roles': ['hash123', 'confirmed']
            };
            this.hoodie.request.defer.resolve(this.response);

            delete this.account.username;
          });

          _and('user has an anonyomous account', function () {

            beforeEach(function () {
              this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(true);

            });

            it('should trigger `signin:anonymous` event', function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.account.trigger).to.be.calledWith('signin:anonymous', 'joe@example.com');
            });
          }); // user has an anonyomous account

          _and('user has a manual account', function () {

            beforeEach(function () {
              this.sandbox.stub(this.account, 'hasAnonymousAccount').returns(false);
            });

            it('should trigger `signin` event', function () {
              this.account.signIn('joe@example.com', 'secret');
              expect(this.account.trigger).to.be.calledWith('signin', 'joe@example.com', 'hash123');
            });

          }); // user has a manual account

          it('should set username', function () {
            this.account.signIn('joe@example.com', 'secret');

            expect(this.account.username).to.eql('joe@example.com');
            expect(this.hoodie.config.set).to.be.calledWith('_account.username', 'joe@example.com');
          });

          it('should fetch the _users doc', function () {
            this.sandbox.spy(this.account, 'fetch');
            this.account.signIn('joe@example.com', 'secret');
            expect(this.account.fetch).to.be.called();
          });

          it('should resolve with username and response', function () {
            this.account.signIn('joe@example.com', 'secret').then(function (res) {
              expect(res).to.eql('joe@example.com', 'hash123');
            });
          });

        }); // account is confirmed

        _and('account not (yet) confirmed', function () {
          beforeEach(function () {
            this.response = {
              'ok': true,
              'name': 'user/joe@example.com',
              'roles': []
            };
            this.hoodie.request.defer.resolve(this.response);
          });

          it('should reject with unconfirmed error.', function () {
            var promise = this.account.signIn('joe@example.com', 'secret');

            promise.fail(function (res) {
              expect(res).to.eql({
                name: 'HoodieAccountUnconfirmedError',
                message: 'Account has not been confirmed yet'
              });
            });
          });
        }); // account not (yet) confirmed

        _and('account has an error', function () {

          beforeEach(function () {
            this.sandbox.stub(this.account, 'fetch')
            .returns(this.hoodie.rejectWith({
              name: 'HoodieRequestError',
              message: 'Because you stink'
            }));

            this.hoodie.request.defer.resolve({
              'ok': true,
              'name': 'user/joe@example.com',
              'roles': ['error']
            });
          });

          it('should fetch user doc without setting username', function () {
            this.account.signIn('joe@example.com', 'secret');

            expect(this.account.fetch).to.be.calledWith('joe@example.com');
            expect(this.account.username).to.be(undefined);
          });

          it('should reject with the reason', function () {
            this.account.signIn('joe@example.com', 'secret').fail(function (res) {
              expect(res).to.eql({
                name: 'HoodieRequestError',
                message: 'Because you stink'
              });
            });
          });
        }); // account has an error
      }); // signIn successful

      _when('signIn not succesful because unauthorized', function () {
        beforeEach(function () {
          this.error = {
            name: 'HoodieUnauthorizedError',
            message: 'Name or password is incorrect'
          };
          this.hoodie.request.defer.reject(this.error);
        });

        it('should be rejected with unauthorized error', function () {
          this.account.signIn('joe@example.com', 'secret').fail(function (res) {
            expect(res).to.eql({
              name: 'HoodieUnauthorizedError',
              message: 'Name or password is incorrect'
            });
          });
        });
      }); // signIn not succesful because unauthorized

      _when('sign in without password', function () {
        it('should set password to empty string', function () {
          var data, options, path, type, args;
          this.hoodie.request.reset();
          this.account.signIn('joe@example.com');

          args = this.hoodie.request.args[0],
          type = args[0],
          path = args[1],
          options = args[2];
          data = options.data;
          expect(data.password).to.eql('');
        });
      }); // sign in without password
    }); // signout succeeds

    _when('options.moveData = true', function () {
      beforeEach(function() {
        var objects = [
          {type: 'task', id: 'abc', title: 'Milk', createdBy: 'somehash'},
          {type: 'task', id: 'def', title: 'Wodka', createdBy: 'somehash'},
          {type: '$config', id: 'hoodie', some: 'funk', createdBy: 'somehash'},
        ];
        this.hoodie.store.findAll.returns(this.hoodie.resolveWith(objects));
        this.signOutDefer.resolve();
        this.account.signIn('joe@example.com', 'secret', {moveData : true});
        this.response = {
          'ok': true,
          'name': 'user/joe@example.com',
          'roles': ['hash123', 'confirmed']
        };
        this.hoodie.request.defer.resolve(this.response);
      });

      it('moves the data', function() {
        expect(this.hoodie.store.add).to.be.calledWith('task', {
          id: 'abc',
          title: 'Milk',
          createdBy: 'hash123'
        });
        expect(this.hoodie.store.add).to.be.calledWith('task', {
          id: 'def',
          title: 'Wodka',
          createdBy: 'hash123'
        });
        expect(this.hoodie.store.add).not.to.be.calledWith('$config', {
          id: 'hoodie',
          some: 'funk',
          createdBy: 'hash123'
        });
      });
    }); // signout succeeds
  }); // #signIn

  describe('#changePassword(currentPassword, newPassword)', function () {
    beforeEach(function () {
      this.account.username = 'joe@example.com';
      presetUserDoc(this);

      this.sandbox.stub(this.account, 'request').returns(this.hoodie.request());
      this.fetchPromise = this.hoodie.defer();
      this.sandbox.stub(this.account, 'fetch').returns(this.fetchPromise);
    });

    it('should fetch the _users doc', function () {
      this.account.changePassword('currentSecret', 'newSecret');
      expect(this.account.fetch).to.be.called();
    });

    _when('fetching _users doc successful', function () {

      beforeEach(function () {
        var args;
        this.fetchPromise.resolve();
        this.account.changePassword('currentSecret', 'newSecret');
        args = this.account.request.args[0],

        this.type = args[0],
        this.path = args[1],
        this.options = args[2];
        this.data = JSON.parse(this.options.data);
      });

      it('should send a PUT request to http://my.hood.ie/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
        expect(this.account.request).to.be.called();
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
        expect(this.data.updatedAt).to.eql( now() );
      });

      it('should not set createdAt to \'now\'', function () {
        expect(this.data.createdAt).to.not.eql( now() );
      });

      it('should pass password', function () {
        expect(this.data.password).to.eql('newSecret');
      });

      it('should allow to set empty password', function () {
        this.account.request.reset();
        this.account.changePassword('currentSecret', '');

        var args = this.account.request.args[0];

        this.type = args[0],
        this.path = args[1],
        this.options = args[2];
        this.data = JSON.parse(this.options.data);

        expect(this.data.password).to.eql('');
      });

      it('should not send salt', function () {
        expect(this.data.salt).to.be(undefined);
      });

      it('should not send password_sha', function () {
        expect(this.data.password_sha).to.be(undefined);
      });

      _when('change password successful', function () {

        beforeEach(function () {
          this.signInDefer = this.hoodie.defer();
          this.sandbox.stub(this.account, 'signIn').returns(this.signInDefer.promise());
          this.hoodie.request.defer.resolve({
            'ok': true,
            'id': 'org.couchdb.user:user/bizbiz',
            'rev': '2-345'
          });
        });

        it('should sign in', function () {
          this.account.changePassword('currentSecret', 'newSecret');
          expect(this.account.signIn).to.be.calledWith('joe@example.com', 'newSecret');
        });

        _when('sign in successful', function () {
          beforeEach(function () {
            this.signInDefer.resolve();
          });

          it('should resolve its promise', function () {
            var promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise).to.be.resolved();
          });
        }); // sign in successful

        _when('sign in not successful', function () {
          beforeEach(function () {
            this.signInDefer.reject();
          });

          it('should reject its promise', function () {
            var promise = this.account.changePassword('currentSecret', 'newSecret');
            expect(promise).to.be.rejected();
          });
        }); // sign in not successful
      }); // change password successful

      _when('change password has an error', function () {
        beforeEach(function () {
          this.hoodie.request.defer.reject({
            name: 'HoodieError',
            message: 'Something wrong'
          });
        });

        it('should reject its promise', function () {
          var promise = this.account.changePassword('currentSecret', 'newSecret');
          expect(promise).to.be.rejectedWith({
            name: 'HoodieError',
            message: 'Something wrong'
          });
        });
      }); // change password has an error
    }); // fetching _users doc successful

    _when('fetching _users has an error', function () {
      beforeEach(function () {
        this.fetchPromise.reject({
          name: 'HoodieError',
          message: 'Something wrong'
        });
      });

      it('should reject its promise', function () {
        var promise = this.account.changePassword('currentSecret', 'newSecret');
        expect(promise).to.be.rejectedWith({
          name: 'HoodieError',
          message: 'Something wrong'
        });
      });
    }); // fetching _users has an error
  }); // #changePassword

  describe('#signOut(options)', function () {

    beforeEach(function () {
      this.hoodie.remote.disconnect.defer.resolve();
    });

    _when('user has no account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
        this.promise = this.account.signOut();
      });

      it('should not send any request', function () {
        expect(this.hoodie.request).to.not.be.called();
      });

      it('should trigger `signout` event', function () {
        expect(this.account.trigger).to.be.calledWith('signout');
      });

      it('should trigger `cleanup` event', function () {
        expect(this.account.trigger).to.be.calledWith('cleanup');
      });

      it('should unset username', function () {
        expect(this.account.username).to.be(undefined);
      });

      it('should return a resolved promise', function () {
        expect(this.promise.state()).to.eql('resolved');
      });

      _when('called with silent: true', function () {
        it('should not trigger `signout` event', function () {
          this.account.trigger.reset();
          this.account.signOut({
            silent: true
          });
          expect(this.account.trigger).to.not.be.calledWith('signout');
        });
      }); // called with silent: true
    }); // user has no account

    _when('user has account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(true);
      });

      _and('user has local changes', function() {
        beforeEach(function () {
          this.hoodie.store.hasLocalChanges.returns(true);
          this.promise = this.account.signOut();
        });

        it('should not disconnect', function () {
          expect(this.hoodie.remote.disconnect).to.not.be.called();
        });

        it('should return a pending promise', function() {
          expect(this.promise).to.be.pending();
        });

        it('should push local changes', function() {
          expect(this.hoodie.remote.push).to.be.called();
        });

        _when('push of local changes fails', function() {
          beforeEach(function() {
            this.hoodie.remote.push.defer.reject();
          });

          it('should reject', function() {
            expect(this.promise).to.be.rejected();
          });
        });

        _when('push of local changes succeeds', function() {
          beforeEach(function() {
            this.hoodie.remote.push.defer.resolve();
            this.hoodie.remote.disconnect.defer.resolve();
          });

          it('should send a DELETE request to http://my.hood.ie/_session', function () {
            expect(this.hoodie.request).to.be.calledWith('DELETE', '/_session');
          });
        });

        _but('account.signOut called with ignoreLocalChanges: true', function() {
          beforeEach(function () {
            this.hoodie.remote.disconnect.reset();
            this.account.signOut({ignoreLocalChanges: true});
          });

          it('should disconnect', function () {
            expect(this.hoodie.remote.disconnect).to.be.called();
          });
        });
      }); // user has local changes


      _and('user has no local changes', function() {
        beforeEach(function () {
          this.hoodie.store.hasLocalChanges.returns(false);
          this.account.signOut();
        });

        it('should disconnect', function () {
          expect(this.hoodie.remote.disconnect).to.be.called();
        });
        it('should send a DELETE request to http://my.hood.ie/_session', function () {
          expect(this.hoodie.request).to.be.calledWith('DELETE', '/_session');
        });

        _when('signOut request successful', function () {

          beforeEach(function () {
            this.hoodie.request.defer.resolve();
            this.account.signOut();
          });

          it('should trigger `signout` event', function () {
            expect(this.account.trigger).to.be.calledWith('signout');
          });

          it('should trigger `cleanup` event', function () {
            expect(this.account.trigger).to.be.calledWith('cleanup');
          });

          it('should unset username', function () {
            expect(this.account.username).to.be(undefined);
          });
        }); // signOut request successful
      }); // user has no local changes
    }); // user has account
  }); // #signOut

  describe('#hasAccount()', function () {
    _when('#username is undefined', function () {
      beforeEach(function () {
        delete this.account.username;
      });

      it('should return false', function () {
        expect(this.account.hasAccount()).to.eql(false);
      });
    }); // #username is undefined

    _when('#username is set', function () {
      beforeEach(function () {
        this.account.username = 'somebody';
      });

      it('should return false', function () {
        expect(this.account.hasAccount()).to.eql(true);
      });
    }); // #username is set
  }); // #hasAccount

  describe('#hasAnonymousAccount()', function () {
    _when('account.username equals hoodie.id()', function () {
      beforeEach(function () {
        this.account.username = 'hash123';
      });

      it('should return true', function () {
        expect(this.account.hasAnonymousAccount()).to.eql(true);
      });
    }); // _account.anonymousPassword is set

    _when('account.username does not equal hoodie.id()', function () {
      beforeEach(function () {
        this.account.username = 'funkyusername';
      });

      it('should return false', function () {
        expect(this.account.hasAnonymousAccount()).to.eql(false);
      });
    }); // _account.anonymousPassword is not set
  }); // #hasAnonymousAccount

  describe('#db()', function () {
    _when('hoodie.id() returns \'hash123\'', function () {

      beforeEach(function() {
        this.hoodie.id.returns('hash123');
      });

      it('should return \'joe$example.com\'', function () {
        (expect(this.account.db())).to.eql('user/hash123');
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
        expect(this.hoodie.request).to.not.be.called();
      });
    }); // username is not set

    _when('username is joe@example.com', function () {

      beforeEach(function () {
        this.account.username = 'joe@example.com';
        this.account.fetch();

        var args = this.hoodie.request.args[0];
        this.type = args[0];
        this.path = args[1];
        this.options = args[2];
      });

      it('should send a GET request to http://my.hood.ie/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
        expect(this.hoodie.request).to.be.called();
        expect(this.type).to.eql('GET');
        expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
      });

      _when('successful', function () {

        beforeEach(function () {
          this.hoodie.request.defer.resolve(unconfirmedUserDoc());
        });

        it('should resolve its promise', function () {
          expect(this.account.fetch()).to.be.resolvedWith(unconfirmedUserDoc());
        });
      }); // successful

      _when('fails', function () {
        beforeEach(function () {
          this.error = {
            name: 'ErrorName',
            message: 'Some reason here'
          };
          this.hoodie.request.defer.reject(this.error);
        });

        it('should resolve its promise', function () {
          expect(this.account.fetch()).to.be.rejectedWith(this.error);
        });
      }); // #fails
    }); // username is joe@example.com
  }); // #fetch

  describe('#destroy()', function () {

    beforeEach(function () {
      this.account.username = 'joe@example.com';

      presetUserDoc(this);

      this.sandbox.stub(this.account, 'request').returns( this.hoodie.request() );

      this.fetchDefer = this.hoodie.defer();
      this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer.promise());
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
          expect(this.hoodie.remote.disconnect).to.be.called();
        });

        it('should fetch the account', function () {
          this.account.destroy();
          expect(this.account.fetch).to.be.called();
        });

        it('should send a PUT request to /_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          this.account.destroy();
          var userObject = unconfirmedUserDoc( this.account.username );
          userObject._deleted = true;
          expect(this.account.request).to.be.calledWith('PUT', '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', {
            data: JSON.stringify(userObject),
            contentType: 'application/json'
          });
        });

        _and('destroy request succesful', function () {
          beforeEach(function () {
            this.hoodie.request.defer.resolve();
            this.account.destroy();
          });

          it('should unset username', function () {
            expect(this.account.username).to.be(undefined);
          });

          it('should trigger signout event', function () {
            expect(this.account.trigger).to.be.calledWith('signout');
          });

          it('should trigger cleanup event', function() {
            expect(this.account.trigger).to.be.calledWith('cleanup');
          });
        }); // destroy request succesful
      }); // fetch is successful

      _and('fetch fails with not_found', function () {

        beforeEach(function () {
          this.error = {
            name: 'HoodieNotFoundError',
            message: 'Missing'
          };
          this.fetchDefer.reject(this.error);
          this.promise = this.account.destroy();
          this.promise;
        });

        it('should resolve anyway', function () {
          expect(this.promise.state()).to.eql('resolved');
        });
      }); // fetch fails with not_found

      _and('fetch fails with unknown error', function () {

        beforeEach(function () {
          this.error = {
            name: 'UnknownError',
            message: 'Dunno'
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

        it('should not unset username', function () {
          expect(this.account.username).to.eql('joe@example.com');
        });

        it('should not trigger signout event', function () {
          expect(this.account.trigger).to.not.be.calledWith('signout');
        });

        it('should not clear config', function () {
          expect(this.hoodie.config.clear).to.not.be.called();
        });
      }); // fetch fails with unknown error
    }); // user has account

    _when('user has no account', function () {

      beforeEach(function () {
        this.sandbox.stub(this.account, 'hasAccount').returns(false);
        this.promise = this.account.destroy();
      });

      it('should return a promise', function () {
        expect(this.promise.state()).to.eql('resolved');
      });

      it('should not try to fetch', function () {
        expect(this.account.fetch).to.not.be.called();
      });

      it('should unset username', function () {
        expect(this.account.username).to.be(undefined);
      });

      it('should trigger signout event', function () {
        expect(this.account.trigger).to.be.calledWith('signout');
      });

      it('should trigger cleanup event', function () {
        expect(this.account.trigger).to.be.calledWith('cleanup');
      });
    }); // user has no account
  }); // #destroy

  describe('#resetPassword(username)', function () {
    beforeEach(function () {
      this.sandbox.stub(this.account, 'checkPasswordReset').returns('checkPasswordResetPromise');
    });

    _when('there is a pending password reset request', function () {

      beforeEach(function () {

        // NOTE:
        // I do not understand, why we have to resetBehavior here.
        this.hoodie.config.get.resetBehavior();

        this.hoodie.config.get.returns('joe/uuid567');
        this.account.resetPassword();
      });

      it('should not send another request', function () {
        expect(this.hoodie.request).to.not.be.called();
      });

      it('should check for the status of the pending request', function () {
        expect(this.account.checkPasswordReset).to.be.called();
      });

      it('should return the promise by the status request', function () {
        expect(this.account.resetPassword()).to.eql('checkPasswordResetPromise');
      });
    }); // there is a pending password reset request

    _when('there is no pending password reset request', function () {

      beforeEach(function () {

        // NOTE:
        // I do not understand, why we have to resetBehavior here.
        this.hoodie.config.get.resetBehavior();

        this.hoodie.config.get.returns(void 0);
        this.hoodie.generateId.returns('uuid567');

        this.account.resetPassword('joe@example.com');

        var args = this.hoodie.request.args[0];
        this.method = args[0];
        this.path = args[1];
        this.options = args[2];
        this.data = JSON.parse(this.options.data);
      });

      it('should generate a reset Password Id and store it locally', function () {
        expect(this.hoodie.config.set).to.be.calledWith('_account.resetPasswordId', 'joe@example.com/uuid567');
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
        expect(this.data.createdAt).to.eql( now() );
        expect(this.data.updatedAt).to.eql( now() );
      });

      it('should return a promise', function () {
        expect(this.account.resetPassword('joe@example.com')).to.be.promise();
      });

      _when('reset Password request successful', function () {
        beforeEach(function () {
          this.promiseSpy = this.sandbox.spy();
          this.account.checkPasswordReset.returns({
            then: this.promiseSpy
          });
          this.hoodie.request.defer.resolve();
        });

        it('should check for the request status', function () {
          this.account.resetPassword('joe@example.com');
          expect(this.account.checkPasswordReset).to.be.called();
        });

        it('should be pending', function () {
          expect(this.account.resetPassword('joe@example.com')).to.be.pending();
        });

        _and('password reset fails', function() {
          beforeEach(function() {
            this.account.one.resetBehavior();
            this.account.one.withArgs('passwordreset').yields();
            this.promise = this.account.resetPassword('joe@example.com');
          });

          it('should resolve', function() {
            expect(this.promise).to.be.resolved();
          });
        });

        _and('password reset fails', function() {
          beforeEach(function() {
            var error = {
              name: 'HoodieNotFoundError',
              message: 'user joe@example.com could not be found',
              object: {
                // leaving out irrelevant properties here.
                rev: '1-234',
                name: '$passwordReset/joe@example.com/uuid567'
              }
            };
            this.account.on.withArgs('error:passwordreset').yields(error);
            this.promise = this.account.resetPassword('joe@example.com');
          });

          it('should resolve', function() {
            expect(this.promise).to.be.rejected();
          });

          it('should deleted the $passwordReset object from /_users', function() {
            var newObject = {
              rev: '1-234',
              name: '$passwordReset/joe@example.com/uuid567',
              _deleted: true
            };
            var auth = btoa('$passwordReset/joe@example.com/uuid567:joe@example.com/uuid567');
            expect(this.hoodie.request).to.be.calledWith('PUT', this.path, {
              headers: { Authorization: 'Basic ' + auth },
              contentType: 'application/json',
              data: JSON.stringify(newObject)
            });
          });
        });
      });

      _when('reset Password request is not successful', function () {
        beforeEach(function () {
          this.hoodie.request.defer.reject({
            name: 'OoopsError',
            message: 'Something here'
          });
        });

        it('should be rejected with the error', function () {
          expect(this.account.resetPassword('joe@example.com')).to.be.rejectedWith({
            name: 'OoopsError',
            message: 'Something here'
          });
        });
      });
    }); // there is no pending password reset request
  }); // #resetPassword

  describe('#changeUsername(currentPassword, newUsername)', function () {
    beforeEach(function () {
      this.account.username = 'joe@example.com';
      presetUserDoc(this);

      this.sandbox.stub(this.account, 'request', this.fakeRequest);
      this.fetchDefer = this.hoodie.defer();
      this.sandbox.stub(this.account, 'fetch').returns(this.fetchDefer);
    });

    it('should return a promise', function () {
      var promise = this.account.changeUsername('secret', 'new.joe@example.com');
      expect(promise).to.be.promise();
    });

    _when('sign in successful', function () {
      beforeEach(function() {
        this.account.username = 'joe@example.com';
        this.promise = this.account.changeUsername('secret', 'new.joe@example.com');
        this.requestDefers[0].resolve(validSignInResponse());

      });
      it('should fetch the _users doc', function () {
        expect(this.account.fetch).to.be.called();
      });

      _and('_users doc can be fetched', function () {

        beforeEach(function () {
          this.fetchDefer.resolve();

          // 2nd request is doc update
          var args = this.account.request.args[1];

          this.type = args[0],
          this.path = args[1],
          this.options = args[2];
          this.data = JSON.parse(this.options.data);
        });

        it('should send a PUT request to http://my.hood.ie/_users/org.couchdb.user%3Auser%2Fjoe%40example.com', function () {
          expect(this.account.request).to.be.called();
          expect(this.type).to.eql('PUT');
          expect(this.path).to.eql('/_users/org.couchdb.user%3Auser%2Fjoe%40example.com');
        });

        it('should set contentType to \'application/json\'', function () {
          expect(this.options.contentType).to.eql('application/json');
        });

        it('should stringify the data', function () {
          expect(typeof this.options.data).to.eql('string');
        });

        it('should downcase and set new username to user \'new.joe@example.com\'', function () {
          expect(this.data.$newUsername).to.eql('new.joe@example.com');
        });

        it('should have set updatedAt to \'now\'', function () {
          expect(this.data.updatedAt).to.eql( now() );
        });

        it('should not set createdAt to \'now\'', function () {
          expect(this.data.createdAt).to.not.eql( now() );
        });

        _when('_users doc could be updated', function () {

          beforeEach(function () {
            this.requestDefers[1].resolve();

            // after the doc update, it signs in again
            // with a delay of 300ms
            this.clock.tick(300);
          });

          it('should disconnect', function () {
            expect(this.hoodie.remote.disconnect).to.be.called();
          });

          it('should sign in with new username', function () {

            expect(this.account.request).to.be.calledWith(
              'POST',
              '/_session',
              {
                data: {
                  name: 'user/new.joe@example.com',
                  password: 'secret'
                }
              }
            );
          });

          _and('signIn is successful', function () {
            beforeEach(function () {
              this.requestDefers[2].resolve( validSignInResponse() );
            });

            it('should be resolved', function () {
              expect(this.promise).to.be.resolved();
            });
          }); // signIn is successful

          _but('signIn has an error', function () {

            beforeEach(function () {
              this.requestDefers[2].reject({
                name: 'HoodieError',
                message: 'Something is wrong'
              });
            });

            it('should be rejected', function () {
              expect(this.promise).to.be.rejected();
            });
          }); // signIn has an error
        }); // _users doc could be updated

        _when('_users doc could not be updated', function () {
          beforeEach(function () {
            this.requestDefers[1].reject();
          });

          it('should be rejected', function () {
            expect(this.promise).to.be.rejected();
          });
        }); // _users doc could not be updated
      }); // _users doc can be fetched

      _but('_users doc cannot be fetched', function () {
        beforeEach(function () {
          this.fetchDefer.reject();
        });

        it('should be rejected', function () {
          expect(this.promise).to.be.rejected();
        });
      }); // _users doc cannot be fetched
    }); // sign in successful

    _when('signIn fails', function () {
      beforeEach(function () {
        this.promise = this.account.changeUsername('secret', 'new.joe@example.com');
        this.requestDefers[0].reject();
      });

      it('should be rejected', function () {
        expect(this.promise).to.be.rejected();
      });
    }); // signIn fails
  }); // #changeUsername


  describe('#subscribeToOutsideEvents', function() {
    beforeEach(function() {
      var events = {};

      var oldOn = this.hoodie.on;
      this.hoodie.on = function() {};
      this.sandbox.stub(this.hoodie, 'on', function(eventName, cb) {
        events[eventName] = cb;
      });
      this.sandbox.spy(this.account, 'request');
      this.sandbox.stub(this.account, 'hasAccount').returns(true);
      this.account.subscribeToOutsideEvents();
      this.hoodie.on = oldOn;
      this.events = events;
    });

    it('subscribes to remote:error:unauthenticated', function() {
      expect(this.events['remote:error:unauthenticated']).to.be.a(Function);
    });

    it('reauthenticateds on remote:error:unauthenticated', function() {
      this.hoodie.request.reset();
      this.events['remote:error:unauthenticated']();
      expect(this.account.request).to.be.calledWith('GET', '/_session');
    });
  });
});

function validSessionResponse () {
  return {
    userCtx: validSignInResponse()
  };
}

function validSignInResponse () {
  return {
    name: 'user/joe@example.com',
    roles: ['hash123', 'confirmed']
  };
}

function invalidSessionResponse () {
  return {
    userCtx: {
      name: null
    }
  };
}

function unconfirmedUserDoc (username) {
  if (!username) {
    username = 'joe@example.com';
  }
  return {
    _id: 'org.couchdb.user:user/' + username,
    _rev: '1-abc',
    name: 'user/' + username,
    type: 'user',
    roles: [],
    salt: 'absalt',
    password_sha: 'pwcdef',
    createdAt: 'someday',
    updatedAt: 'someday',
    signedUpAt: 'someday'
  };
}

function presetUserDoc(context) {
  context.account.fetch();
  context.hoodie.request.defer.resolve(unconfirmedUserDoc( context.account.username ));
  context.hoodie.request.reset();
  var defer = $.Deferred();
  context.hoodie.request.returns(defer.promise());
  context.hoodie.request.defer = defer;
}


function with_session_validated_before (callback) {
  _when('session has been validated before', function() {
    beforeEach(function() {
      var response = {
        userCtx: {
          name: 'user/joe@example.com',
          roles: ['hash123', 'confirmed']
        }
      };
      this.hoodie.request.defer.resolve(response);
      this.account.authenticate();

      // now we have to reset the requestDefer
      this.account.request.reset();

      var defer = $.Deferred();
      this.hoodie.request.returns(defer.promise());
      this.hoodie.request.defer = defer;
      this.account.request.returns(defer.promise());
    });

    callback();
  });
}

function with_session_invalidated_before (callback) {
  _when('session has been invalidated before', function() {
    beforeEach(function() {
      var response = {
        userCtx: {
          name: null
        }
      };
      this.hoodie.request.defer.resolve(response);
      this.account.authenticate();

      // now we have to reset the requestDefer
      this.account.request.reset();

      var defer = $.Deferred();
      this.hoodie.request.returns(defer.promise());
      this.hoodie.request.defer = defer;
      this.account.request.returns(defer.promise());
    });

    callback();
  });
}

function now() {
  return '1970-01-01T00:00:00.000Z';
}
