describe "Hoodie.Account", ->
  beforeEach ->
    localStorage.clear()
    
    @hoodie  = new Mocks.Hoodie
    @account = new Hoodie.Account @hoodie

    @request_defer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @request_defer.promise()
  
    # requests
    spyOn(@hoodie, "trigger")


  describe ".constructor()", ->
    beforeEach ->
      spyOn(Hoodie.Account.prototype, "authenticate")
      spyOn(Hoodie.Account.prototype, "on")
    
    _when "account.username is set", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andCallFake (key) ->
          if key is '_account.username'
            return 'joe@example.com'
            
      it "should set @username", ->
        account = new Hoodie.Account @hoodie
        expect(account.username).toBe 'joe@example.com'
      
    it "should bind to sign_in event", ->
      account = new Hoodie.Account @hoodie
      expect(@account.on).wasCalledWith 'sign_in', account._handle_sign_in
    
    it "should bind to sign_out event", ->
      account = new Hoodie.Account @hoodie
      expect(@account.on).wasCalledWith 'sign_out', account._handle_sign_out
  # /.constructor()
  
  

  describe "event handlers", ->
    describe "._handle_sign_in(@username)", ->
      beforeEach ->
        expect(@account.username).toBeUndefined()
        spyOn(@hoodie.config, "set")
        @account._handle_sign_in 'joe@example.com'
      
      it "should set @username", ->
        expect(@account.username).toBe 'joe@example.com'
        
      it "should store @username to config", ->
        expect(@hoodie.config.set).wasCalledWith '_account.username', 'joe@example.com'
        
      it "should set _authenticated to true", ->
        @account._authenticated = false
        @account._handle_sign_in "joe@example.com"
        expect(@account._authenticated).toBe true
    # /._handle_sign_in(@username)
    
    describe "._handle_sign_out()", ->
      it "should set @username", ->
        @account.username = 'joe@example.com'
        @account._handle_sign_out {"ok":true}
        do expect(@account.username).toBeUndefined
        
      it "should store @username persistantly", ->
        spyOn(@hoodie.config, "remove")
        @account._handle_sign_out {"ok":true}
        expect(@hoodie.config.remove).wasCalledWith '_account.username'
        
      it "should set _authenticated to false", ->
        @account._authenticated = true
        @account._handle_sign_out {"ok":true}
        expect(@account._authenticated).toBe false
    # /._handle_sign_out()
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
        

        # {"ok":true,"userCtx":{"name":"@example.com","roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}}
        _when "authentication request is successful and returns joe@example.com", ->
          beforeEach ->
            @request_defer.resolve userCtx: name: 'joe@example.com'
            @promise = @account.authenticate()
            
          it "should set account as authenticated", ->
            expect(@account._authenticated).toBe true
            
          it "should resolve the promise with 'joe@example.com'", ->
            expect(@promise).toBeResolvedWith 'joe@example.com'
        
        # {"ok":true,"userCtx":{"name":null,"roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"]}}
        _when "authentication request is successful and returns `name: null`", ->
          beforeEach ->
            @request_defer.resolve userCtx: name: null
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
            @request_defer.reject responseText: 'error data'
            @promise = @account.authenticate()
          
          it "should reject the promise", ->
            expect(@promise).toBeRejectedWith error: 'error data'
          
  # /.authenticate()


  describe ".sign_up(username, password)", ->
    beforeEach ->
      @defer = @hoodie.defer()
      @hoodie.request.andReturn @defer.promise()
      @account.sign_up('joe@example.com', 'secret', name: "Joe Doe")
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
      expect(@data.password).toBe 'secret'
      
    it "should allow to signup without password", ->
      @account.sign_up('joe@example.com')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
      expect(@data.password).toBe ''
            
    _when "sign_up successful", ->
      beforeEach ->
        @response = response = {"ok":true,"id":"org.couchdb.user:bizbiz","rev":"1-a0134f4a9909d3b20533285c839ed830"}
        @defer.resolve(@response).promise()
      
      it "should trigger `account:sign_up` event", ->
        @account.sign_up('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:sign_up', 'joe@example.com'
        
      it "should sign in", ->
        spyOn(@account, "sign_in").andReturn then: ->
        @account.sign_up 'joe@example.com', 'secret'
        expect(@account.sign_in).wasCalledWith 'joe@example.com', 'secret'
        
      it "should resolve its promise", ->
        promise = @account.sign_up('joe@example.com', 'secret')
        expect(promise).toBeResolvedWith 'joe@example.com', @response
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.sign_up('joe@example.com', 'secret')
        expect(@account.fetch).wasCalled()
        
    _when "sign_up has an error", ->
      beforeEach ->
        @defer.reject responseText: '{"error":"forbidden","reason":"Username may not start with underscore."}'
      
      it "should reject its promise", ->
        promise = @account.sign_up('_joe@example.com', 'secret')
        expect(promise).toBeRejectedWith responseText: '{"error":"forbidden","reason":"Username may not start with underscore."}'
  # /.sign_up(username, password)


  describe ".sign_in(username, password)", ->
    beforeEach ->
      @defer = @hoodie.defer()
      @hoodie.request.andReturn @defer.promise()
      @account.sign_in('joe@example.com', 'secret')
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
      @account.sign_in('joe@example.com')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      data = @options.data
      expect(data.password).toBe ''
      
    _when "sign_up successful", ->
      beforeEach ->
        @defer.resolve()
        
      it "should trigger `account:sign_in` event", ->
        @account.sign_in('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:sign_in', 'joe@example.com'
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.sign_in('joe@example.com', 'secret')
        expect(@account.fetch).wasCalled()
  # /.sign_in(username, password)


  describe ".change_password(username, password)", ->
    beforeEach ->
      @account.username = 'joe@example.com'
      @account._doc  = 
        _id          : 'org.couchdb.user:joe@example.com'
        name         : 'joe@example.com'
        type         : 'user'
        roles        : []
        salt         : 'absalt'
        password_sha : 'pwcdef'
        
        
      @account.change_password('current_secret', 'new_secret')
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
      expect(@data.password).toBe 'new_secret'
      
    it "should allow to set empty password", ->
      @account.change_password('current_secret','')
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
      @data = JSON.parse @options.data
      expect(@data.password).toBe ''
      
    it "should not send salt", ->
      expect(@data.salt).toBeUndefined()
      
    it "should not send password_sha", ->
      expect(@data.password_sha).toBeUndefined()
      
            
    _when "change password successful", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> 
          response = {"ok":true,"id":"org.couchdb.user:bizbiz","rev":"2-345"}
          options.success response
        
      it "should resolve its promise", ->
        promise = @account.change_password('current_secret', 'new_secret')
        expect(promise).toBeResolved()
        
      it "should fetch the _users doc", ->
        spyOn(@account, "fetch")
        @account.change_password('current_secret', 'new_secret')
        expect(@account.fetch).wasCalled()
        
    _when "sign_up has an error", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> options.error {}
      
      it "should reject its promise", ->
        promise = @account.change_password('current_secret', 'new_secret')
        expect(promise).toBeRejectedWith error:"unknown"
  # /.change_password(username, password)


  describe ".sign_out()", ->
    beforeEach ->
      @account.sign_out()
      [@type, @path, @options] = @hoodie.request.mostRecentCall.args
  
    it "should send a DELETE request to http://my.cou.ch/_session", ->
      expect(@hoodie.request).wasCalled()
      expect(@type).toBe 'DELETE'
      expect(@path).toBe  '/_session'
      
    _when "sign_up successful", ->
      beforeEach ->
        @hoodie.request.andCallFake (type, path, options) -> options.success()
        
      it "should trigger `account:sign_out` event", ->
        @account.sign_out('joe@example.com', 'secret')
        expect(@hoodie.trigger).wasCalledWith 'account:sign_out'
  # /.sign_in(username, password)
  
  
  describe ".on(event, callback)", ->
    beforeEach ->
      spyOn(@hoodie, "on")
      
    it "should proxy to @hoodie.on() and namespace with account", ->
      party = jasmine.createSpy 'party'
      @account.on('funky', party)
      (expect @hoodie.on).wasCalledWith('account:funky', party)
  # /.on(event, callback)
  
  
  describe ".db", ->
    _when "username is set to 'joe.doe@example.com'", ->
      beforeEach ->
        @account.username = 'joe.doe@example.com'
      
      it "should return 'joe$example_com", ->
        (expect @account.db()).toEqual('joe_doe$example_com')
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
          @response = {"_id":"org.couchdb.user:baz","_rev":"3-33e4d43a6dff5b29a4bd33f576c7824f","name":"baz","salt":"82163606fa5c100e0095ad63598de810","password_sha":"e2e2a4d99632dc5e3fdb41d5d1ff98743a1f344e","type":"user","roles":[]}
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

