describe "Hoodie.Account", ->
  beforeEach ->
    localStorage.clear()
    
    @hoodie  = new Mocks.Hoodie
    @account = new Hoodie.Account @hoodie

    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
  
    # requests
    spyOn(@hoodie, "trigger")

    # skip timeouts
    spyOn(window, "setTimeout").andCallFake (cb) -> cb()


  describe "constructor", ->
    beforeEach ->
      spyOn(Hoodie.Account.prototype, "authenticate")
      spyOn(Hoodie.Account.prototype, "on")
    
    _when "account.username is set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.username'
            return 'joe@example.com'
            
      it "should set @username", ->
        account = new Hoodie.Account @hoodie
        expect(account.username).toBe 'joe@example.com'

    _when "account.ownerHash is set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.ownerHash'
            return 'owner_hash123'
            
      it "should set @owner", ->
        account = new Hoodie.Account @hoodie
        expect(account.ownerHash).toBe 'owner_hash123'

    _when "account.ownerHash isn't set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.ownerHash'
            return undefined

        spyOn(@hoodie.my.store, "uuid").andReturn 'new_generated_owner_hash'
        spyOn(@hoodie.my.config, "set")
            
      it "should set @owner", ->
        account = new Hoodie.Account @hoodie
        expect(account.ownerHash).toBe 'new_generated_owner_hash'

      it "should set account.ownerHash", ->
         account = new Hoodie.Account @hoodie
         expect(account.hoodie.my.config.set).wasCalledWith '_account.ownerHash', 'new_generated_owner_hash'

    it "should authenticate on next tick", ->
      account = new Hoodie.Account @hoodie
      expect(window.setTimeout).wasCalledWith account.authenticate
      
    it "should check for a pending password request", ->
      spyOn(Hoodie.Account.prototype, "_checkPasswordResetStatus")
      account = new Hoodie.Account @hoodie
      expect(Hoodie.Account.prototype._checkPasswordResetStatus).wasCalled()
  # /.constructor()
  
  
  describe ".authenticate()", ->
    _when "@username is undefined", ->
      beforeEach ->
        delete @account.username
        @promise = @account.authenticate()
            
      it "should return a rejected promise", ->
        expect(@promise).toBePromise()
        expect(@promise).toBeRejected()
        
    _when "@username is 'joe@example.com'", ->
      beforeEach ->
        @account.username = 'joe@example.com'
      
      _and "account is already authenticated", ->
        beforeEach ->
          @account._authenticated = true
          @promise = @account.authenticate()
          
        it "should return a promise", ->
          expect(@promise).toBePromise()

        it "should resolve the promise", ->
          expect(@promise).toBeResolvedWith 'joe@example.com'
      
      _and "account is unauthenticated", ->
        beforeEach ->
          @account._authenticated = false
          @promise = @account.authenticate()
          
        it "should return a promise", ->
          expect(@promise).toBePromise()

        it "should reject the promise", ->
          expect(@promise).toBeRejected()
          
      _and "account has not been authenticated yet", ->
        beforeEach ->
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
            spyOn(@hoodie.my.config, "set")
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
            expect(@hoodie.my.config.set).wasCalledWith '_account.username', 'joe@example.com'

          it "should set account.ownerHash", ->
             expect(@account.ownerHash).toBe 'user_hash'
             expect(@hoodie.my.config.set).wasCalledWith '_account.ownerHash', 'user_hash'
        
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


  describe ".signUp(username, password)", ->
    beforeEach ->
      @signInDefer = @hoodie.defer()
      spyOn(@account, "signIn").andReturn @signInDefer.promise()
      @account.ownerHash = "owner_hash123"
      @account.signUp('joe@example.com', 'secret', name: "Joe Doe")
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
  
    it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
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

    it "should have set $createdBy to 'owner_hash123'", ->
      expect(@data.$createdBy).toBe 'owner_hash123'

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
        expect(@account.signIn).wasCalledWith 'joe@example.com', 'secret'
      
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

  
  describe ".anonymousSignUp()", ->
    beforeEach ->
      @signUpDefer = @hoodie.defer()
      spyOn(@account, "signUp").andReturn @signUpDefer.promise()
      spyOn(@hoodie.my.store, "uuid").andReturn "crazyuuid123"
      spyOn(@hoodie.my.config, "set")
      @account.ownerHash = "owner_hash123"
       
    it "should sign up with username = 'user_anonymous/ownerHash' and the random password", ->
      @account.anonymousSignUp()
      expect(@account.signUp).wasCalledWith 'owner_hash123', 'crazyuuid123'

    _when "signUp successful", ->
      beforeEach ->
        @signUpDefer.resolve()

      it "should generate a password and store it locally in _account.anonymousPassword", ->
        @account.anonymousSignUp()
        expect(@hoodie.my.store.uuid).wasCalledWith 10
        expect(@hoodie.my.config.set).wasCalledWith '_account.anonymousPassword', 'crazyuuid123'
      
  # /.anonymousSignUp()


  describe ".signIn(username, password)", ->
    beforeEach ->
      @account.signIn('joe@example.com', 'secret')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
  
    it "should send a POST request to http://my.cou.ch/_session", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'POST'
      expect(@path).toBe  '/_session'
    
    it "should send username as name parameter", ->
      expect(@options.data.name).toBe 'user/joe@example.com'
  
    it "should send password", ->
      expect(@options.data.password).toBe 'secret'

    it "should allow to sign in without password", ->
      @account.signIn('joe@example.com')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      data = @options.data
      expect(data.password).toBe ''
      
    _when "signIn successful", ->
      _and "account is confirmed", ->
        beforeEach ->
          @response = {"ok":true,"name":"user/joe@example.com","roles":["user_hash","confirmed"]}
          @requestDefer.resolve @response
          spyOn(@hoodie.my.config, "set")
        
        it "should trigger `account:signin` event", ->
          @account.signIn('joe@example.com', 'secret')
          expect(@hoodie.trigger).wasCalledWith 'account:signin', 'joe@example.com'
        
        it "should set @username", ->
           @account.signIn('joe@example.com', 'secret')
           expect(@account.username).toBe 'joe@example.com'
           expect(@hoodie.my.config.set).wasCalledWith '_account.username', 'joe@example.com'

        it "should set @owner", ->
           @account.signIn('joe@example.com', 'secret')
           expect(@account.ownerHash).toBe 'user_hash'
           expect(@hoodie.my.config.set).wasCalledWith '_account.ownerHash', 'user_hash'

        it "should fetch the _users doc", ->
          spyOn(@account, "fetch")
          @account.signIn('joe@example.com', 'secret')
          expect(@account.fetch).wasCalled()

        it "should resolve with username and response", ->
          expect(@account.signIn('joe@example.com', 'secret')).toBeResolvedWith 'joe@example.com', @response

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
  # /.signIn(username, password)


  describe ".changePassword(currentPassword, newPassword)", ->
    beforeEach ->
      @account.username = 'joe@example.com'
      @account._doc  = 
        _id          : 'org.couchdb.user:user/joe@example.com'
        name         : 'user/joe@example.com'
        type         : 'user'
        roles        : []
        salt         : 'absalt'
        password_sha : 'pwcdef'
        
        
      @account.changePassword('currentSecret', 'newSecret')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
  
    it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
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
        
    _when "signUp has an error", ->
      beforeEach ->
        @requestDefer.reject()
      
      it "should reject its promise", ->
        promise = @account.changePassword('currentSecret', 'newSecret')
        expect(promise).toBeRejectedWith error:"unknown"
  # /.changePassword(username, password)


  describe ".signOut()", ->
    beforeEach ->
      spyOn(@hoodie.my.remote, "disconnect")
      @account.signOut()
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
    
    it "should disconnect", ->
      expect(@hoodie.my.remote.disconnect).wasCalled() 

    it "should send a DELETE request to http://my.cou.ch/_session", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'DELETE'
      expect(@path).toBe  '/_session'
      
    _when "signUp successful", ->
      beforeEach ->
        @requestDefer.resolve()
        spyOn(@hoodie.my.config, "clear")
        @account.signOut()
        
      it "should trigger `account:signout` event", ->
        expect(@hoodie.trigger).wasCalledWith 'account:signout'

      it "should unset @owner", ->
         expect(@account.ownerHash).toBeUndefined()

      it "should unset @username", ->
         expect(@account.username).toBeUndefined()

      it "should clear config", ->
        expect(@hoodie.my.config.clear).wasCalled() 
  # /.signIn(username, password)


  describe ".hasAnonymousAccount()", ->
    _when "_account.anonymousPassword is set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.username'
            return 'password'

        it "should return true", ->
           expect(@account.hasAnonymousAccount()).toBe true

    _when "_account.anonymousPassword is not set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.username'
            return undefined

      it "should return false", ->
         expect(@account.hasAnonymousAccount()).toBe false      
  # /.hasAnonymousAccount
  
  
  describe ".on(event, callback)", ->
    beforeEach ->
      spyOn(@hoodie, "on")
      
    it "should proxy to @hoodie.on() and namespace with account", ->
      party = jasmine.createSpy 'party'
      @account.on('funky', party)
      (expect @hoodie.on).wasCalledWith('account:funky', party)
  # /.on(event, callback)
  
  
  describe ".db()", ->
    _when "account.ownerHash is 'owner_hash123'", ->
      beforeEach ->
        @account.ownerHash = 'owner_hash123'
      
      it "should return 'joe$example.com", ->
        (expect @account.db()).toEqual('user/owner_hash123')
  # /.db()
  
  describe ".fetch()", ->
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
      
      it "should send a GET request to http://my.cou.ch/_users/org.couchdb.user%3Auser%2Fjoe%40example.com", ->
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
  
  describe ".destroy()", ->
    beforeEach ->
      spyOn(@hoodie.my.remote, "disconnect")
      spyOn(@account, "fetch").andReturn @hoodie.defer().resolve().promise()
      @account.username = 'joe@example.com'
      @account._doc = _rev : '1-234'
    
    it "should disconnect", ->
      @account.destroy()
      expect(@hoodie.my.remote.disconnect).wasCalled()
    
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

    _when "destroy request succesful", ->
      beforeEach ->
        @hoodie.request.andReturn @hoodie.defer().resolve().promise()

      it "should unset @username", ->
        @account.destroy()
        expect(@account.username).toBeUndefined() 

      it "should unset @owner", ->
        @account.destroy()
        expect(@account.ownerHash).toBeUndefined()
  # /destroy()

  describe ".resetPassword(username)", ->
    beforeEach ->
      spyOn(@account, "_checkPasswordResetStatus").andReturn "checkPasswordResetPromise"

    _when "there is a pending password reset request", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andReturn "joe/uuid567"
        @account.resetPassword()

      it "should not send another request", ->
        expect(@hoodie.request).wasNotCalled() 

      it "should check for the status of the pending request", ->
        expect(@account._checkPasswordResetStatus).wasCalled()

      it "should return the promise by the status request", ->
        expect(@account.resetPassword()).toBe 'checkPasswordResetPromise'

    _when "there is no pending password reset request", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andReturn undefined
        spyOn(@hoodie.my.config, "set")
        spyOn(@hoodie.my.store, "uuid").andReturn 'uuid567'
        @account.resetPassword("joe@example.com")
        [@method, @path, @options] = @hoodie.request.mostRecentCall.args
        @data = JSON.parse @options.data

      it "should generate a reset Password Id and store it locally", ->
        expect(@hoodie.my.config.set).wasCalledWith "_account.resetPasswordId", "joe@example.com/uuid567"

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

  describe ".changeUsername(currentPassword, newUsername)", ->
    beforeEach ->
      @authenticateDefer = @hoodie.defer()
      spyOn(@account, "authenticate").andReturn @authenticateDefer.promise()
      @account.changeUsername('secret', 'new.joe@example.com')
    
    it "should authenticate", ->
       expect(@account.authenticate).wasCalled()

    it "should return a promise", ->
       expect(@account.changeUsername()).toBePromise()
  # /.changeUsername(currentPassword, newUsername)
# /Hoodie.Account