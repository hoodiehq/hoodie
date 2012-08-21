describe "Hoodie.Account", ->
  beforeEach ->
    localStorage.clear()
    
    @hoodie  = new Mocks.Hoodie
    @account = new Hoodie.Account @hoodie

    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
  
    # requests
    spyOn(@hoodie, "trigger")


  describe ".constructor()", ->
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

    _when "account.owner is set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.owner'
            return 'owner_hash123'
            
      it "should set @owner", ->
        account = new Hoodie.Account @hoodie
        expect(account.owner).toBe 'owner_hash123'

    _when "account.owner isn't set", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andCallFake (key) ->
          if key is '_account.owner'
            return undefined

        spyOn(@hoodie.my.store, "uuid").andReturn 'new_generated_owner_hash'
        spyOn(@hoodie.my.config, "set")
            
      it "should set @owner", ->
        account = new Hoodie.Account @hoodie
        expect(account.owner).toBe 'new_generated_owner_hash'

      it "should set account.owner", ->
         account = new Hoodie.Account @hoodie
         expect(account.hoodie.my.config.set).wasCalledWith '_account.owner', 'new_generated_owner_hash'
      
    it "should bind to signIn event", ->
      account = new Hoodie.Account @hoodie
      expect(@account.on).wasCalledWith 'signin', account._handleSignIn
    
    it "should bind to signOut event", ->
      account = new Hoodie.Account @hoodie
      expect(@account.on).wasCalledWith 'signout', account._handleSignOut
  # /.constructor()
  
  

  describe "event handlers", ->
    describe "._handleSignIn(@username)", ->
      beforeEach ->
        expect(@account.username).toBeUndefined()
        spyOn(@hoodie.my.config, "set")
        @account._handleSignIn 'joe@example.com'
      
      it "should set @username", ->
        expect(@account.username).toBe 'joe@example.com'
        
      it "should store @username to config", ->
        expect(@hoodie.my.config.set).wasCalledWith '_account.username', 'joe@example.com'
        
      it "should set _authenticated to true", ->
        @account._authenticated = false
        @account._handleSignIn "joe@example.com"
        expect(@account._authenticated).toBe true
    # /._handleSignIn(@username)
    
    describe "._handleSignOut()", ->
      it "should unset @username", ->
        @account.username = 'joe@example.com'
        @account._handleSignOut {"ok":true}
        do expect(@account.username).toBeUndefined
        
      it "should remove @username from persistent config", ->
        spyOn(@hoodie.my.config, "remove")
        @account._handleSignOut {"ok":true}
        expect(@hoodie.my.config.remove).wasCalledWith '_account.username'

      it "should remove @owner from persistent config", ->
        spyOn(@hoodie.my.config, "remove")
        @account._handleSignOut {"ok":true}
        expect(@hoodie.my.config.remove).wasCalledWith '_account.owner'
        
      it "should set _authenticated to false", ->
        @account._authenticated = true
        @account._handleSignOut {"ok":true}
        expect(@account._authenticated).toBe false
    # /._handleSignOut()
  # /event handlers
  
  
  describe ".authenticate()", ->
    _when "@username is undefined", ->
      beforeEach ->
        delete @account.username
        @promise = @account.authenticate()
            
      it "should return a promise", ->
        expect(@promise).toBePromise()
        
      it "should reject the promise", ->
        expect(@promise).toBeRejected()
        
    _when "@username is 'joe@example.com", ->
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
        

        # {"ok":true,"userCtx":{"name":"@example.com","roles":[]},"info":{"authenticationDb":"_users","authenticationHandlers":["oauth","cookie","default"],"authenticated":"cookie"}}
        _when "authentication request is successful and returns joe@example.com", ->
          beforeEach ->
            @requestDefer.resolve userCtx: name: 'joe@example.com'
            @promise = @account.authenticate()
            
          it "should set account as authenticated", ->
            expect(@account._authenticated).toBe true
            
          it "should resolve the promise with 'joe@example.com'", ->
            expect(@promise).toBeResolvedWith 'joe@example.com'
        
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
            
          it "should unset username", ->
            expect(@account.username).toBeUndefined()
            
        _when "authentication request has an error", ->
          beforeEach ->
            @requestDefer.reject responseText: 'error data'
            @promise = @account.authenticate()
          
          it "should reject the promise", ->
            expect(@promise).toBeRejectedWith error: 'error data'
          
  # /.authenticate()


  describe ".signUp(username, password)", ->
    beforeEach ->
      @defer = @hoodie.defer()
      @hoodie.request.andReturn @defer.promise()
      @account.owner = "owner_hash123"
      @account.signUp('joe@example.com', 'secret', name: "Joe Doe")
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
  
    it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'PUT'
      expect(@path).toBe  '/_users/org.couchdb.user%3Ajoe%40example.com'
      
    it "should set contentType to 'application/json'", ->
      expect(@options.contentType).toBe 'application/json'
    
    it "should stringify the data", ->
      expect(typeof @options.data).toBe 'string'
  
    it "should have set _id to 'org.couchdb.user:joe@example.com'", ->
      expect(@data._id).toBe 'org.couchdb.user:joe@example.com'
    
    it "should have set name to 'joe@example.com", ->
      expect(@data.name).toBe 'joe@example.com'
      
    it "should have set type to 'user", ->
      expect(@data.type).toBe 'user'

    it "should have set password to 'secret'", ->
      expect(@data.password).toBe 'secret'

    it "should have set $owner to 'owner_hash123'", ->
      expect(@data.$owner).toBe 'owner_hash123'

    it "should have set database to 'user/owner_hash123'", ->
      expect(@data.database).toBe 'user/owner_hash123'
      
    it "should allow to signup without password", ->
      @account.signUp('joe@example.com')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
      expect(@data.password).toBe ''
            
    _when "signUp successful", ->
      beforeEach ->
        @response = response = {"ok":true,"id":"org.couchdb.user:bizbiz","rev":"1-a0134f4a9909d3b20533285c839ed830"}
        @defer.resolve(@response).promise()
      
      it "should trigger `account:signup` event", ->
        @account.signUp('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:signup', 'joe@example.com'
        
      it "should sign in", ->
        spyOn(@account, 'signIn').andReturn then: ->
        @account.signUp 'joe@example.com', 'secret'
        expect(@account.signIn).wasCalledWith 'joe@example.com', 'secret'
        
      it "should resolve its promise", ->
        promise = @account.signUp('joe@example.com', 'secret')
        expect(promise).toBeResolvedWith 'joe@example.com', @response
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.signUp('joe@example.com', 'secret')
        expect(@account.fetch).wasCalled()
        
    _when "signUp has an error", ->
      beforeEach ->
        @defer.reject responseText: '{"error":"forbidden","reason":"Username may not start with underscore."}'
      
      it "should reject its promise", ->
        promise = @account.signUp('_joe@example.com', 'secret')
        expect(promise).toBeRejectedWith responseText: '{"error":"forbidden","reason":"Username may not start with underscore."}'
  # /.signUp(username, password)


  describe ".signIn(username, password)", ->
    beforeEach ->
      @defer = @hoodie.defer()
      @hoodie.request.andReturn @defer.promise()
      @account.signIn('joe@example.com', 'secret')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
  
    it "should send a POST request to http://my.cou.ch/_session", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'POST'
      expect(@path).toBe  '/_session'
    
    it "should send username as name parameter", ->
      expect(@options.data.name).toBe 'joe@example.com'
  
    it "should send password", ->
      expect(@options.data.password).toBe 'secret'

    it "should allow to sign in without password", ->
      @account.signIn('joe@example.com')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      data = @options.data
      expect(data.password).toBe ''
      
    _when "signUp successful", ->
      beforeEach ->
        @defer.resolve()
        
      it "should trigger `account:signin` event", ->
        @account.signIn('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:signin', 'joe@example.com'
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.signIn('joe@example.com', 'secret')
        expect(@account.fetch).wasCalled()
  # /.signIn(username, password)


  describe ".changePassword(username, password)", ->
    beforeEach ->
      @account.username = 'joe@example.com'
      @account._doc  = 
        _id          : 'org.couchdb.user:joe@example.com'
        name         : 'joe@example.com'
        type         : 'user'
        roles        : []
        salt         : 'absalt'
        passwordSha : 'pwcdef'
        
        
      @account.changePassword('currentSecret', 'newSecret')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
  
    it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'PUT'
      expect(@path).toBe  '/_users/org.couchdb.user%3Ajoe%40example.com'
      
    it "should set contentType to 'application/json'", ->
      expect(@options.contentType).toBe 'application/json'
    
    it "should stringify the data", ->
      expect(typeof @options.data).toBe 'string'
  
    it "should have set _id to 'org.couchdb.user:joe@example.com'", ->
      expect(@data._id).toBe 'org.couchdb.user:joe@example.com'
    
    it "should have set name to 'joe@example.com", ->
      expect(@data.name).toBe 'joe@example.com'
      
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
      
    it "should not send passwordSha", ->
      expect(@data.passwordSha).toBeUndefined()
      
            
    _when "change password successful", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> 
          response = {"ok":true,"id":"org.couchdb.user:bizbiz","rev":"2-345"}
          options.success response
        
      it "should resolve its promise", ->
        promise = @account.changePassword('currentSecret', 'newSecret')
        expect(promise).toBeResolved()
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.changePassword('currentSecret', 'newSecret')
        expect(@account.fetch).wasCalled()
        
    _when "signUp has an error", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> options.error {}
      
      it "should reject its promise", ->
        promise = @account.changePassword('currentSecret', 'newSecret')
        expect(promise).toBeRejectedWith error:"unknown"
  # /.changePassword(username, password)


  describe ".signOut()", ->
    beforeEach ->
      @account.signOut()
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
  
    it "should send a DELETE request to http://my.cou.ch/_session", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'DELETE'
      expect(@path).toBe  '/_session'
      
    _when "signUp successful", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> options.success()
        
      it "should trigger `account:signout` event", ->
        @account.signOut('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:signout'
  # /.signIn(username, password)
  
  
  describe ".on(event, callback)", ->
    beforeEach ->
      spyOn(@hoodie, "on")
      
    it "should proxy to @hoodie.on() and namespace with account", ->
      party = jasmine.createSpy 'party'
      @account.on('funky', party)
      (expect @hoodie.on).wasCalledWith('account:funky', party)
  # /.on(event, callback)
  
  
  describe ".db", ->
    _when "account.owner is 'owner_hash123'", ->
      beforeEach ->
        @account.owner = 'owner_hash123'
      
      it "should return 'joe$exampleCom", ->
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
      
      it "should send a GET request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
        expect(@hoodie.request).wasCalled()
        expect(@type).toBe 'GET'
        expect(@path).toBe  '/_users/org.couchdb.user%3Ajoe%40example.com'
      
      _when "successful", ->
        beforeEach ->
          @response = {"_id":"org.couchdb.user:baz","_rev":"3-33e4d43a6dff5b29a4bd33f576c7824f","name":"baz","salt":"82163606fa5c100e0095ad63598de810","passwordSha":"e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e","type":"user","roles":[]}
          @hoodie.request.andCallFake (type, path, options) => 
            options.success @response
        
        it "should resolve its promise", ->
          promise = @account.fetch()
          expect(promise).toBeResolvedWith @response
  # /.fetch()
  
  describe "destroy()", ->
    beforeEach ->
      spyOn(@account, "fetch").andReturn @hoodie.defer().resolve().promise()
      @account.username = 'joe@example.com'
      @account._doc = _rev : '1-234'
    
    it "should fetch the account", ->
      @account.destroy()
      expect(@account.fetch).wasCalled()
    
    it "should send a DELETE request to /_users/org.couchdb.user%3Ajoe%40example.com?rev=1-234", ->
      @account.destroy()
      expect(@hoodie.request).wasCalledWith 'DELETE', '/_users/org.couchdb.user%3Ajoe%40example.com?rev=1-234'
  # /destroy()
# /Hoodie.Account

