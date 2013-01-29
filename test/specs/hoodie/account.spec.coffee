describe "Hoodie.Account", ->
  beforeEach ->
    localStorage.clear()
    
    @hoodie  = new Mocks.Hoodie
    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
    spyOn(@hoodie, "trigger")

    # skip timeouts
    spyOn(window, "setTimeout").andCallFake (cb) -> cb()

    @account = new Hoodie.Account @hoodie

    # I don't get why, but somehow Hoodie.Account::_requests gets overwritten
    # once it was set in a @account instance. I couldn't figure out where that
    # comes from, so I just reset it here:
    @account._requests = {}

  describe "constructor", ->
    beforeEach ->
      spyOn(Hoodie.Account.prototype, "on")
    
    _when "account.username is set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.username'
            return 'joe@example.com'
            
      it "should set @username", ->
        account = new Hoodie.Account @hoodie
        expect(account.username).toBe 'joe@example.com'

    _when "account.ownerHash is set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.ownerHash'
            return 'owner_hash123'
            
      it "should set @ownerHash", ->
        account = new Hoodie.Account @hoodie
        expect(account.ownerHash).toBe 'owner_hash123'
    _when "account.ownerHash isn't set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.ownerHash'
            return undefined

        spyOn(@hoodie, "uuid").andReturn 'new_generated_owner_hash'
        spyOn(@hoodie.config, "set")
            
      it "should set @ownerHash", ->
        account = new Hoodie.Account @hoodie
        expect(account.ownerHash).toBe 'new_generated_owner_hash'

      it "should set account.ownerHash", ->
         account = new Hoodie.Account @hoodie
         expect(account.hoodie.config.set).wasCalledWith '_account.ownerHash', 'new_generated_owner_hash'

    it "should authenticate on next tick", ->
      account = new Hoodie.Account @hoodie
      expect(window.setTimeout).wasCalledWith account.authenticate
      
    it "should check for a pending password request", ->
      spyOn(Hoodie.Account.prototype, "_checkPasswordResetStatus")
      account = new Hoodie.Account @hoodie
      expect(Hoodie.Account.prototype._checkPasswordResetStatus).wasCalled()
  # /.constructor()
  
  
  describe "#authenticate()", ->
    
    _when "account.username is not set", ->
      beforeEach ->
        @promise = @account.authenticate()
      
      it "should return a rejected promise", ->
        expect(@promise).toBeRejected()

      it "should send a sign out request, but not cleanup", ->
        expect(@hoodie.request).wasCalledWith 'DELETE', '/_session' 

    _when "account is already authenticated", ->
      beforeEach ->
        @account._authenticated = true
        @account.username = 'joe@example.com'
        @promise = @account.authenticate()
        
      it "should return a promise", ->
        expect(@promise).toBePromise()

      it "should resolve the promise", ->
        expect(@promise).toBeResolvedWith 'joe@example.com'

    _when "account is unauthenticated", ->
      beforeEach ->
        @account._authenticated = false
        @promise = @account.authenticate()
        
      it "should return a promise", ->
        expect(@promise).toBePromise()

      it "should reject the promise", ->
        expect(@promise).toBeRejected()

    _when "account has not been authenticated yet", ->
      beforeEach ->
        @account.username = 'joe@example.com'
        delete @account._authenticated
      
      it "should return a promise", ->
        expect( @account.authenticate() ).toBePromise()
        
      it "should send a GET /_session", ->
        @account.authenticate()
        expect(@hoodie.request).wasCalled()
        args = @hoodie.request.mostRecentCall.args
        expect(args[0]).toBe 'GET'
        expect(args[1]).toBe '/_session'

      _when "authentication request is successful and returns session info for joe@example.com", ->
        beforeEach ->
          spyOn(@hoodie.config, "set")
          @response = userCtx:
                        name: "user/joe@example.com",
                        roles: [ "user_hash", "confirmed" ]
          @requestDefer.resolve @response
          @promise = @account.authenticate()
          
        it "should set account as authenticated", ->
          expect(@account._authenticated).toBe true
          
        it "should resolve the promise with 'joe@example.com'", ->
          expect(@promise).toBeResolvedWith 'joe@example.com'

        it "should set account.username", ->
          expect(@account.username).toBe 'joe@example.com'
          expect(@hoodie.config.set).wasCalledWith '_account.username', 'joe@example.com'

        it "should set account.ownerHash", ->
           expect(@account.ownerHash).toBe 'user_hash'
           expect(@hoodie.config.set).wasCalledWith '_account.ownerHash', 'user_hash'
      
      # {"ok":true,"userCtx":{"name":null,"roles":[]},"info":{"authenticationDb":"_users","authenticationHandlers":["oauth","cookie","default"]}}
      _when "authentication request is successful and returns `name: null`", ->
        beforeEach ->
          @requestDefer.resolve userCtx: name: null
          @account.username = 'joe@example.com'
          @promise = @account.authenticate()
          
        it "should set account as unauthenticated", ->
          expect(@account._authenticated).toBe false
          
        it "should reject the promise", ->
          expect(@promise).toBeRejected()
          
        it "should trigger an `account:error:unauthenticated` event", ->
          expect(@hoodie.trigger).wasCalledWith 'account:error:unauthenticated'
          
      _when "authentication request has an error", ->
        beforeEach ->
          @requestDefer.reject responseText: 'error data'
          @promise = @account.authenticate()
        
        it "should reject the promise", ->
          expect(@promise).toBeRejectedWith error: 'error data'
  # /.authenticate()


  describe "#signUp(username, password)", ->
    beforeEach ->
      @account.ownerHash = "owner_hash123"
  
    _when "username not set", ->
      beforeEach ->
        @promise = @account.signUp('', 'secret', name: "Joe Doe")

      it "should be rejected", ->
        expect(@promise).toBeRejectedWith error: 'username must be set'

    _when "username set", ->
      _and "user has an anonmyous account", ->
        beforeEach ->
          spyOn(@account, "hasAnonymousAccount").andReturn true

          @fetchDefer = @hoodie.defer()
          spyOn(@account, "fetch").andReturn @fetchDefer.promise()

          spyOn(@hoodie.config, "get").andReturn 'randomPassword'
          @account.username = 'randomUsername'

          @signInDefer1 = @hoodie.defer()
          @signInDefer2 = @hoodie.defer()
          signInDefers = [@signInDefer1.promise(), @signInDefer2.promise()]
          spyOn(@account, "_sendSignInRequest").andCallFake -> signInDefers.shift()

          @promise = @account.signUp('joe@example.com', 'secret', name: "Joe Doe")

        it "should sign in", ->
          expect(@account._sendSignInRequest).wasCalledWith 'randomUsername', 'randomPassword'

        _when "sign in successful", ->
          beforeEach ->
            @signInDefer1.resolve('randomUsername')

          it "should fetch the _users doc", ->
            expect(@account.fetch).wasCalled()
          
          _when "fetching user doc successful", ->
            beforeEach ->
              @account._doc = 
                _id          : 'org.couchdb.user:user/joe@example.com'
                name         : 'user/joe@example.com'
                type         : 'user'
                roles        : []
                salt         : 'absalt'
                password_sha : 'pwcdef'
              @fetchDefer.resolve()
              [@type, @path, @options] = @hoodie.request.mostRecentCall.args
              @data = JSON.parse @options.data

            it "should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
              expect(@hoodie.request).wasCalled()
              expect(@type).toBe 'PUT'
              expect(@path).toBe  '/_users/org.couchdb.user%3Auser%2FrandomUsername'
            
            it "should set contentType to 'application/json'", ->
              expect(@options.contentType).toBe 'application/json'
            
            it "should stringify the data", ->
              expect(typeof @options.data).toBe 'string'

            it "should have set name to 'user/joe@example.com", ->
              expect(@data.$newUsername).toBe 'joe@example.com'

            _when "_users doc could be updated", ->
              beforeEach ->
                spyOn(@hoodie.remote, "disconnect")
                @requestDefer.resolve()

              it "should disconnect", ->
                expect(@hoodie.remote.disconnect).wasCalled() 

              it "should sign in with new username", ->
                expect(@account._sendSignInRequest).wasCalledWith 'joe@example.com', 'secret'

              _and "signIn is successful", ->
                beforeEach ->
                  @signInDefer2.resolve('joe@example.com')

                it "should be resolved", ->
                  expect(@promise).toBeResolvedWith 'joe@example.com'

              _but "signIn has an error", ->
                beforeEach ->
                  @signInDefer2.reject error: 'oops'

                it "should be resolved", ->
                  expect(@promise).toBeRejectedWith error: 'oops'

            _when "_users doc could not be updated", ->
              beforeEach ->
                @requestDefer.reject()

              it "should be rejected", ->
                expect(@promise).toBeRejectedWith error: 'unknown'

          _when "fetching user doc not successful", ->
            beforeEach ->
              @fetchDefer.reject(error: 'whatever')

            it "should be rejected", ->
              expect(@promise).toBeRejectedWith error: 'whatever'

      _but "user is already logged in", ->
        beforeEach ->
          spyOn(@account, "hasAccount").andReturn true

        it "should be rejected", ->
          promise = @account.signUp 'joe@example.com', 'secret' 
          expect(promise).toBeRejectedWith error: 'you have to sign out first'

      _and "user is logged out", ->
        beforeEach ->
          spyOn(@account, "hasAccount").andReturn false
          @signInDefer = @hoodie.defer()
          spyOn(@account, "_sendSignInRequest").andReturn @signInDefer.promise()
          @account.signUp('joe@example.com', 'secret', name: "Joe Doe")
          [@type, @path, @options] = @hoodie.request.mostRecentCall.args
          @data = JSON.parse @options.data

        it "should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
          expect(@hoodie.request).wasCalled()
          expect(@type).toBe 'PUT'
          expect(@path).toBe  '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com'
          
        it "should set contentType to 'application/json'", ->
          expect(@options.contentType).toBe 'application/json'
        
        it "should stringify the data", ->
          expect(typeof @options.data).toBe 'string'
      
        it "should have set _id to 'org.couchdb.user:joe@example.com'", ->
          expect(@data._id).toBe 'org.couchdb.user:user/joe@example.com'
        
        it "should have set name to 'joe@example.com", ->
          expect(@data.name).toBe 'user/joe@example.com'
          
        it "should have set type to 'user", ->
          expect(@data.type).toBe 'user'

        it "should have set password to 'secret'", ->
          expect(@data.password).toBe 'secret'

        it "should have set ownerHash to 'owner_hash123'", ->
          expect(@data.ownerHash).toBe 'owner_hash123'

        it "should have set database to 'user/owner_hash123'", ->
          expect(@data.database).toBe 'user/owner_hash123'
          
        it "should allow to signup without password", ->
          @account.signUp('joe@example.com')
          [@type, @path, @options] = @hoodie.request.mostRecentCall.args
          @data = JSON.parse @options.data
          expect(@data.password).toBe ''
                
        _when "signUp successful", ->
          beforeEach ->
            response = {"ok":true,"id":"org.couchdb.user:bizbiz","rev":"1-a0134f4a9909d3b20533285c839ed830"}
            @requestDefer.resolve response
          
          it "should trigger `account:signup` event", ->
            @account.signUp('joe@example.com', 'secret')
            expect(@hoodie.trigger).wasCalledWith 'account:signup', 'joe@example.com'
            
          it "should sign in", ->
            @account.signUp 'joe@example.com', 'secret'
            expect(@account._sendSignInRequest).wasCalledWith 'joe@example.com', 'secret'
          
          _and "signIn successful", ->
            beforeEach ->
              @signInDefer.resolve("joe@example.com", 'response')

            it "should resolve its promise", ->
              promise = @account.signUp('joe@example.com', 'secret')
              expect(promise).toBeResolvedWith 'joe@example.com', 'response'

          _and "signIn not successful", ->
            beforeEach ->
              @signInDefer.reject 'error'

            it "should resolve its promise", ->
              promise = @account.signUp('joe@example.com', 'secret')
              expect(promise).toBeRejectedWith 'error'
            
        _when "signUp has an error", ->
          beforeEach ->
            @requestDefer.reject responseText: '{"error":"forbidden","reason":"You stink."}'
          
          it "should reject its promise", ->
            promise = @account.signUp('notmyfault@example.com', 'secret')
            expect(promise).toBeRejectedWith 
              error  : 'forbidden'
              reason : 'You stink.'
  # /.signUp(username, password)

  describe "#anonymousSignUp()", ->
    beforeEach ->
      @signUpDefer = @hoodie.defer()
      spyOn(@account, "signUp").andReturn @signUpDefer.promise()
      spyOn(@hoodie, "uuid").andReturn "crazyuuid123"
      spyOn(@hoodie.config, "set")
      @account.ownerHash = "owner_hash123"
       
    it "should sign up with username = 'user_anonymous/ownerHash' and the random password", ->
      @account.anonymousSignUp()
      expect(@account.signUp).wasCalledWith 'owner_hash123', 'crazyuuid123'

    _when "signUp successful", ->
      beforeEach ->
        @signUpDefer.resolve()

      it "should generate a password and store it locally in _account.anonymousPassword", ->
        @account.anonymousSignUp()
        expect(@hoodie.uuid).wasCalledWith 10
        expect(@hoodie.config.set).wasCalledWith '_account.anonymousPassword', 'crazyuuid123'
  # /.anonymousSignUp()


  describe "#signIn(username, password)", ->
    beforeEach ->
      @signOutDefer = @hoodie.defer()
      spyOn(@account, "signOut").andReturn @signOutDefer.promise()

    # when a user signs in, it's a transition from an anonymous
    # user to a signed in user, so we need to clear up some stuff.
    # That's why we call signOut before signing the user in.
    # At the same time, when I call `hoodie.account.signIn`, I
    # don't want a 'signout' event to be triggerd, that's why
    # `signOut` needs to be called silently from within `signIn`
    it "should sign out silently", ->
      @account.signIn('joe@example.com', 'secret')
      expect(@account.signOut).wasCalledWith silent: true

    _when "signout errors", ->
      beforeEach ->
        @signOutDefer.reject reason: 'a unicorn just cried'

      it "should return the rejected promise", ->
        promise = @account.signOut()
        expect(promise).toBeRejectedWith reason: 'a unicorn just cried' 
    
    _when "signout succeeds", ->      
      beforeEach ->
        @signOutDefer.resolve()
        @account.signIn('joe@example.com', 'secret')
        [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      
      it "should send a POST request to http://cou.ch/_session", ->
        expect(@hoodie.request).wasCalled()
        expect(@type).toBe 'POST'
        expect(@path).toBe  '/_session'
      
      it "should send username as name parameter", ->
        expect(@options.data.name).toBe 'user/joe@example.com'
      
      it "should send password", ->
        expect(@options.data.password).toBe 'secret'

      _and "signIn successful", ->
        _and "account is confirmed", ->
          beforeEach ->
            @response = {"ok":true,"name":"user/joe@example.com","roles":["user_hash","confirmed"]}
            @requestDefer.resolve @response
            spyOn(@hoodie.config, "set")
          
          _and "user has an anonyomous account", ->
            beforeEach ->
              spyOn(@account, "hasAnonymousAccount").andReturn true
            
            it "should trigger `account:signin:anonymous` event", ->
              @account.signIn('joe@example.com', 'secret')
              expect(@hoodie.trigger).wasCalledWith 'account:signin:anonymous', 'joe@example.com'

          _and "user has a manual account", ->
            beforeEach ->
              spyOn(@account, "hasAnonymousAccount").andReturn false
            
            it "should trigger `account:signin` event", ->
              @account.signIn('joe@example.com', 'secret')
              expect(@hoodie.trigger).wasCalledWith 'account:signin', 'joe@example.com'
          
          it "should set @username", ->
             @account.signIn('joe@example.com', 'secret')
             expect(@account.username).toBe 'joe@example.com'
             expect(@hoodie.config.set).wasCalledWith '_account.username', 'joe@example.com'

          it "should set @ownerHash", ->
             @account.signIn('joe@example.com', 'secret')
             expect(@account.ownerHash).toBe 'user_hash'
             expect(@hoodie.config.set).wasCalledWith '_account.ownerHash', 'user_hash'
             expect(@hoodie.config.set).wasCalledWith '$createdBy', 'user_hash'

          it "should fetch the _users doc", ->
            spyOn(@account, "fetch")
            @account.signIn('joe@example.com', 'secret')
            expect(@account.fetch).wasCalled()

          it "should resolve with username and response", ->
            expect(@account.signIn('joe@example.com', 'secret')).toBeResolvedWith 'joe@example.com', 'user_hash'

        _and "account not (yet) confirmed", ->
          beforeEach ->
            @response = {"ok":true,"name":"user/joe@example.com","roles":[]}
            @requestDefer.resolve @response

          it "should reject with unconfirmed error.", ->
            promise = @account.signIn('joe@example.com', 'secret')
            expect(promise).toBeRejectedWith error: "unconfirmed", reason: "account has not been confirmed yet"

        _and "account has an error", ->
          beforeEach ->
            @response = {"ok":true,"name":"user/joe@example.com","roles":['error']}
            @requestDefer.resolve @response 
            spyOn(@account, "fetch").andCallFake =>
              @account._doc.$error = 'because you stink!'
              return @hoodie.defer().resolve()

          it "should fetch user doc without setting @username", ->
            @account.signIn('joe@example.com', 'secret')
            expect(@account.fetch).wasCalledWith 'joe@example.com'
            expect(@account.username).toBeUndefined()

          it "should reject with the reason", ->
            expect(@account.signIn('joe@example.com', 'secret')).toBeRejectedWith 
              error: 'error'
              reason: 'because you stink!'

      _when "signIn not succesful because unauthorized", ->
        beforeEach ->
          @response = responseText: """{"error":"unauthorized","reason":"Name or password is incorrect."}"""
          @requestDefer.reject @response

        it "should be rejected with unauthorized error", ->
          expect(@account.signIn('joe@example.com', 'secret')).toBeRejectedWith
            error:"unauthorized"
            reason:"Name or password is incorrect."

      _when "sign in without password", ->
        it "should set password to empty string", ->
          @account._requests = {}
          @account.signIn('joe@example.com')
          [type, path, options] = @hoodie.request.mostRecentCall.args
          data = options.data
          expect(data.password).toBe ''
  # /.signIn(username, password)


  describe "#changePassword(currentPassword, newPassword)", ->
    beforeEach ->
      @account.username = 'joe@example.com'
      @account._doc  = 
        _id          : 'org.couchdb.user:user/joe@example.com'
        name         : 'user/joe@example.com'
        type         : 'user'
        roles        : []
        salt         : 'absalt'
        password_sha : 'pwcdef'
        
      @fetchPromise = @hoodie.defer()
      spyOn(@account, "fetch").andReturn @fetchPromise

    it "should fetch the _users doc", ->
      @account.changePassword('currentSecret', 'newSecret')
      expect(@account.fetch).wasCalled()

    _when "fetching _users doc successful", ->
      beforeEach ->
        @fetchPromise.resolve()
        @account.changePassword('currentSecret', 'newSecret')
        [@type, @path, @options] = @hoodie.request.mostRecentCall.args
        @data = JSON.parse @options.data

  
      it "should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
        expect(@hoodie.request).wasCalled()
        expect(@type).toBe 'PUT'
        expect(@path).toBe  '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com'
      
      it "should set contentType to 'application/json'", ->
        expect(@options.contentType).toBe 'application/json'
      
      it "should stringify the data", ->
        expect(typeof @options.data).toBe 'string'
    
      it "should have set _id to 'org.couchdb.user:user/joe@example.com'", ->
        expect(@data._id).toBe 'org.couchdb.user:user/joe@example.com'
      
      it "should have set name to 'user/joe@example.com", ->
        expect(@data.name).toBe 'user/joe@example.com'
        
      it "should have set type to 'user", ->
        expect(@data.type).toBe 'user'

      it "should pass password", ->
        expect(@data.password).toBe 'newSecret'
        
      it "should allow to set empty password", ->
        @account.changePassword('currentSecret','')
        [@type, @path, @options] = @hoodie.request.mostRecentCall.args
        @data = JSON.parse @options.data
        expect(@data.password).toBe ''
        
      it "should not send salt", ->
        expect(@data.salt).toBeUndefined()
        
      it "should not send password_sha", ->
        expect(@data.password_sha).toBeUndefined()
        
      _when "change password successful", ->
        beforeEach ->
          @signInDefer = @hoodie.defer()
          spyOn(@account, "signIn").andReturn @signInDefer.promise()
          @requestDefer.resolve {"ok":true,"id":"org.couchdb.user:user/bizbiz","rev":"2-345"}

        it "should sign in", ->
          @account.changePassword('currentSecret', 'newSecret')
          expect(@account.signIn).wasCalledWith 'joe@example.com', 'newSecret'
          
        _when "sign in successful", ->
          beforeEach ->
            @signInDefer.resolve()

          it "should resolve its promise", ->
            promise = @account.changePassword('currentSecret', 'newSecret')
            expect(promise).toBeResolved()
        
        _when "sign in not successful", ->
          beforeEach ->
            @signInDefer.reject()

          it "should reject its promise", ->
            promise = @account.changePassword('currentSecret', 'newSecret')
            expect(promise).toBeRejected()
          
      _when "change password has an error", ->
        beforeEach ->
          @requestDefer.reject()
        
        it "should reject its promise", ->
          promise = @account.changePassword('currentSecret', 'newSecret')
          expect(promise).toBeRejectedWith error:"unknown"

    _when "fetching _users has an error", ->
      beforeEach ->
        @fetchPromise.reject()
      
      it "should reject its promise", ->
        promise = @account.changePassword('currentSecret', 'newSecret')
        expect(promise).toBeRejectedWith error:"unknown"

  # /.changePassword(username, password)


  describe "#signOut(options)", ->
    beforeEach ->
      spyOn(@hoodie, "uuid").andReturn 'newHash'
      spyOn(@hoodie.config, "clear")
    
    _when "called with silent: true", ->
      it "should not trigger `account:signout` event", ->
        @account.signOut silent: true
        expect(@hoodie.trigger).wasNotCalledWith 'account:signout'
      
    _when "user has no account", ->
      beforeEach ->
        spyOn(@account, "hasAccount").andReturn false
        @promise = @account.signOut()

      it "should not send any request", ->
        expect(@hoodie.request).wasNotCalled() 

      it "should trigger `account:signout` event", ->
        expect(@hoodie.trigger).wasCalledWith 'account:signout'

      it "should generate new @ownerHash hash", ->
         expect(@account.ownerHash).toBe 'newHash'

      it "should unset @username", ->
         expect(@account.username).toBeUndefined()

      it "should clear config", ->
        expect(@hoodie.config.clear).wasCalled() 

      it "should return a resolved promise", ->
        expect(@promise).toBePromise()
        expect(@promise).toBeResolved()
         
      
    _when "user has account", ->
      beforeEach ->
        spyOn(@hoodie.remote, "disconnect")
        spyOn(@account, "hasAccount").andReturn true
        @account.signOut()
        [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      
      it "should disconnect", ->
        expect(@hoodie.remote.disconnect).wasCalled() 

      it "should send a DELETE request to http://cou.ch/_session", ->
        expect(@hoodie.request).wasCalled()
        expect(@type).toBe 'DELETE'
        expect(@path).toBe  '/_session'
        
      _when "signOut request successful", ->
        beforeEach ->
          @requestDefer.resolve()
          @account.signOut()
          
        it "should trigger `account:signout` event", ->
          expect(@hoodie.trigger).wasCalledWith 'account:signout'

        it "should generate new @ownerHash hash", ->
           expect(@account.ownerHash).toBe 'newHash'

        it "should unset @username", ->
           expect(@account.username).toBeUndefined()

        it "should clear config", ->
          expect(@hoodie.config.clear).wasCalled() 
  # /.signOut(options)


  describe "#hasAccount()", ->
    _when "#username is undefined", ->
      beforeEach ->
        delete @account.username

      it "should return false", ->
         expect(@account.hasAccount()).toBe false

    _when "#username is set", ->
      beforeEach ->
        @account.username = 'somebody'

      it "should return false", ->
         expect(@account.hasAccount()).toBe true      
  # /.hasAccount


  describe "#hasAnonymousAccount()", ->
    _when "_account.anonymousPassword is set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.anonymousPassword'
            return 'password'

      it "should return true", ->
         expect(@account.hasAnonymousAccount()).toBe true

    _when "_account.anonymousPassword is not set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.anonymousPassword'
            return undefined

      it "should return false", ->
         expect(@account.hasAnonymousAccount()).toBe false      
  # /.hasAnonymousAccount
  
  
  describe "#on(event, callback)", ->
    beforeEach ->
      spyOn(@hoodie, "on")
      
    it "should proxy to @hoodie.on() and namespace with account", ->
      party = jasmine.createSpy 'party'
      @account.on('funky', party)
      (expect @hoodie.on).wasCalledWith('account:funky', party)

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @account.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'account:super account:funky account:fresh', cb
  # /.on(event, callback)
  
  
  describe "#db()", ->
    _when "account.ownerHash is 'owner_hash123'", ->
      beforeEach ->
        @account.ownerHash = 'owner_hash123'
      
      it "should return 'joe$example.com", ->
        (expect @account.db()).toEqual('user/owner_hash123')
  # /.db()
  
  describe "#fetch()", ->
    _when "username is not set", ->
      beforeEach ->
        @account.username = null
        @account.fetch()
      
      it "should not send any request", ->
        expect(@hoodie.request).wasNotCalled()
      
    
    _when "username is joe@example.com", ->
      beforeEach ->
        @account.username = 'joe@example.com'
        @account.fetch()
        [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      
      it "should send a GET request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
        expect(@hoodie.request).wasCalled()
        expect(@type).toBe 'GET'
        expect(@path).toBe  '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com'
      
      _when "successful", ->
        beforeEach ->
          @response = {"_id":"org.couchdb.user:baz","_rev":"3-33e4d43a6dff5b29a4bd33f576c7824f","name":"baz","salt":"82163606fa5c100e0095ad63598de810","password_sha":"e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e","type":"user","roles":[]}
          @requestDefer.resolve(@response)
        
        it "should resolve its promise", ->
          promise = @account.fetch()
          expect(promise).toBeResolvedWith @response
  # /.fetch()
  
  describe "#destroy()", ->
    beforeEach ->
      spyOn(@hoodie.remote, "disconnect")
      spyOn(@hoodie.config, "clear")
      spyOn(@hoodie.config, "set")
      spyOn(@account, "fetch").andReturn @hoodie.defer().resolve().promise()
      spyOn(@hoodie, "uuid").andReturn 'newHash'
      @account.username = 'joe@example.com'
      @account._doc = _rev : '1-234'
    
    it "should disconnect", ->
      @account.destroy()
      expect(@hoodie.remote.disconnect).wasCalled()
    
    it "should fetch the account", ->
      @account.destroy()
      expect(@account.fetch).wasCalled()
    
    it "should send a PUT request to /_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
      @account.destroy()
      expect(@hoodie.request).wasCalledWith 'PUT', '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com'
        data : JSON.stringify
          _rev     : '1-234'
          _deleted : true
        contentType : 'application/json' 

    _when "user has account", ->
      beforeEach ->
        spyOn(@account, "hasAccount").andReturn true

      it "should return a promise", ->
        expect(@account.destroy()).toBePromise() 

      _and "destroy request succesful", ->
        beforeEach ->
          @hoodie.request.andReturn @hoodie.defer().resolve().promise()
          @account.destroy()

        it "should unset @username", ->
          expect(@account.username).toBeUndefined() 

        it "should regenerate @ownerHash", ->
          expect(@account.ownerHash).toBe 'newHash'

        it "should trigger signout event", ->
          expect(@hoodie.trigger).wasCalledWith 'account:signout'

        it "should clear config", ->
          expect(@hoodie.config.clear).wasCalled() 

        it "should set config._account.ownerHash to new @ownerHash", ->
          expect(@hoodie.config.set).wasCalledWith '_account.ownerHash', 'newHash'

    _when "user has no account", ->
      beforeEach ->
        spyOn(@account, "hasAccount").andReturn false
        @promise = @account.destroy()

      it "should return a promise", ->
        expect(@promise).toBePromise()

      it "should not try to fetch", ->
        expect(@account.fetch).wasNotCalled() 

      it "should unset @username", ->
        expect(@account.username).toBeUndefined() 

      it "should regenerate @ownerHash", ->
        expect(@account.ownerHash).toBe 'newHash'

      it "should trigger signout event", ->
        expect(@hoodie.trigger).wasCalledWith 'account:signout'

      it "should clear config", ->
        expect(@hoodie.config.clear).wasCalled() 

      it "should set config._account.ownerHash to new @ownerHash", ->
        expect(@hoodie.config.set).wasCalledWith '_account.ownerHash', 'newHash'
  # /destroy()

  describe "#resetPassword(username)", ->
    beforeEach ->
      spyOn(@account, "_checkPasswordResetStatus").andReturn "checkPasswordResetPromise"

    _when "there is a pending password reset request", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andReturn "joe/uuid567"
        @account.resetPassword()

      it "should not send another request", ->
        expect(@hoodie.request).wasNotCalled() 

      it "should check for the status of the pending request", ->
        expect(@account._checkPasswordResetStatus).wasCalled()

      it "should return the promise by the status request", ->
        expect(@account.resetPassword()).toBe 'checkPasswordResetPromise'

    _when "there is no pending password reset request", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andReturn undefined
        spyOn(@hoodie.config, "set")
        spyOn(@hoodie, "uuid").andReturn 'uuid567'
        @account.resetPassword("joe@example.com")
        [@method, @path, @options] = @hoodie.request.mostRecentCall.args
        @data = JSON.parse @options.data

      it "should generate a reset Password Id and store it locally", ->
        expect(@hoodie.config.set).wasCalledWith "_account.resetPasswordId", "joe@example.com/uuid567"

      it "should send a PUT request to /_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567", ->
        expect(@method).toBe 'PUT'
        expect(@path).toBe '/_users/org.couchdb.user%3A%24passwordReset%2Fjoe%40example.com%2Fuuid567'

      it "should send data with contentType 'application/json'", ->
        expect(@options.contentType).toBe 'application/json' 

      it "should send a new _users object", ->
        expect(@data._id).toBe      'org.couchdb.user:$passwordReset/joe@example.com/uuid567'
        expect(@data.name).toBe     "$passwordReset/joe@example.com/uuid567"
        expect(@data.type).toBe     'user'
        expect(@data.password).toBe 'joe@example.com/uuid567'
        expect(@data.$createdAt).toBeDefined()
        expect(@data.$updatedAt).toBeDefined()

      it "should return a promise", ->
         expect(@account.resetPassword("joe@example.com")).toBePromise()

      _when "reset Password request successful", ->
        beforeEach ->
          @promiseSpy = jasmine.createSpy 'promiseSpy'
          @account._checkPasswordResetStatus.andReturn then: @promiseSpy
          @requestDefer.resolve()

        it "should check for the request status", ->
          @account.resetPassword('joe@example.com')
          expect(@account._checkPasswordResetStatus).wasCalled() 

        it "should be resolved", ->
          expect(@account.resetPassword('joe@example.com')).toBeResolved()
          
      _when "reset Password request is not successful", ->
        beforeEach ->
          @requestDefer.reject responseText: '{"error": "ooops"}'

        it "should be rejected with the error", ->
          expect(@account.resetPassword('joe@example.com')).toBeRejectedWith error: 'ooops'
  # /.resetPassword(username)

  describe "#changeUsername(currentPassword, newUsername)", ->
    beforeEach ->
      @signInDefer1 = @hoodie.defer()
      @signInDefer2 = @hoodie.defer()
      signInDefers = [@signInDefer1, @signInDefer2]
      spyOn(@account, "_sendSignInRequest").andCallFake -> signInDefers.shift()

      @fetchDefer = @hoodie.defer()
      spyOn(@account, "fetch").andReturn @fetchDefer

      @account.username = 'joe@example.com'
      @account._doc  = 
        _id          : 'org.couchdb.user:user/joe@example.com'
        name         : 'user/joe@example.com'
        type         : 'user'
        roles        : []
        salt         : 'absalt'
        password_sha : 'pwcdef'
    
    it "should return a promise", ->
      @account.changeUsername('secret', 'new.joe@example.com')
      expect(@account.changeUsername()).toBePromise()

    _when "sign in successful", ->
      beforeEach ->
        @signInDefer1.resolve('joe@example.com')
      
      it "should fetch the _users doc", ->
        @account.changeUsername('secret', 'new.joe@example.com')
        expect(@account.fetch).wasCalled()

      _and "_users doc can be fetched", ->
        beforeEach ->
          @fetchDefer.resolve()
          @account.username = 'joe@example.com'
          @promise = @account.changeUsername('secret', 'new.joe@example.com')
          [@type, @path, @options] = @hoodie.request.mostRecentCall.args
          @data = JSON.parse @options.data

        it "should send a PUT request to http://cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
          expect(@hoodie.request).wasCalled()
          expect(@type).toBe 'PUT'
          expect(@path).toBe  '/_users/org.couchdb.user%3Auser%2Fjoe%40example.com'
        
        it "should set contentType to 'application/json'", ->
          expect(@options.contentType).toBe 'application/json'
        
        it "should stringify the data", ->
          expect(typeof @options.data).toBe 'string'

        it "should have set name to 'user/joe@example.com", ->
          expect(@data.$newUsername).toBe 'new.joe@example.com'

        _when "_users doc could be updated", ->
          beforeEach ->
            spyOn(@hoodie.remote, "disconnect")
            @requestDefer.resolve()

          it "should disconnect", ->
            expect(@hoodie.remote.disconnect).wasCalled() 

          it "should sign in with new username", ->
            expect(@account._sendSignInRequest).wasCalledWith 'new.joe@example.com', 'secret'

          _and "signIn is successful", ->
            beforeEach ->
              @signInDefer2.resolve('fuckyeah')

            it "should be resolved", ->
              expect(@promise).toBeResolvedWith 'fuckyeah'

          _but "signIn has an error", ->
            beforeEach ->
              @signInDefer2.reject error: 'oops'

            it "should be resolved", ->
              expect(@promise).toBeRejectedWith error: 'oops'
        
        _when "_users doc could not be updated", ->
          beforeEach ->
            @requestDefer.reject()

          it "should be rejected", ->
            expect(@promise).toBeRejectedWith error: 'unknown'

      _but "_users doc cannot be fetched", ->
        beforeEach ->
          @fetchDefer.reject error: 'something'

        it "should be rejected", ->
          promise = @account.changeUsername('secret', 'new.joe@example.com')
          expect(promise).toBeRejectedWith error: 'something'

    _when "signIn not successful", ->
      beforeEach ->
        @signInDefer1.reject(error: 'autherror')

      it "should be rejected", ->
        promise = @account.changeUsername('secret', 'new.joe@example.com')
        expect(promise).toBeRejectedWith error: 'autherror'
  # /.changeUsername(currentPassword, newUsername)
# /Hoodie.Account