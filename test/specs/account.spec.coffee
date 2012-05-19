define 'specs/account', ['mocks/hoodie', 'account'], (CangMock, Account) ->
  
  describe "Account", ->
    beforeEach ->
      @app = new CangMock
      @account = new Account @app    
    
      # requests
      spyOn(@app, "request")
      spyOn(@app, "trigger")
      
    # /description
  
    describe "new", ->
      beforeEach ->
        spyOn(Account.prototype, "authenticate")
        spyOn(Account.prototype, "on")
      
      _when "_couch.account.email is set", ->
        beforeEach ->
          spyOn(@app.store.db, "getItem").andCallFake (key) ->
            if key is '_couch.account.email'
              return 'joe@example.com'
              
          it "should set @email", ->
            account = new Account @app
            expect(account.email).toBe 'joe@example.com'          
            
      it "should authenticate", ->
        account = new Account @app
        expect(account.authenticate).wasCalled()
        
      it "should bind to sign_in event", ->
        account = new Account @app
        expect(@account.on).wasCalledWith 'signed_in', account._handle_sign_in
      
      it "should bind to sign_out event", ->
        account = new Account @app
        expect(@account.on).wasCalledWith 'signed_out', account._handle_sign_out
    # /new
    
    describe "event handlers", ->
      
      describe "_handle_sign_in", ->
        beforeEach ->
          spyOn(@app.store.db, "setItem")
          @account._handle_sign_in 'joe@example.com'
        
        it "should set @email", ->
          expect(@account.email).toBe 'joe@example.com'
          
        it "should store @email persistantly", ->
          expect(@app.store.db.setItem).wasCalledWith '_couch.account.email', 'joe@example.com'
          
        it "should set _authenticated to true", ->
          @account._authenticated = false
          @account._handle_sign_in {"ok":true,"name":"joe@example.com","roles":[]}
          expect(@account._authenticated).toBe true
      # /_handle_sign_in
      
      describe "_handle_sign_out", ->
        it "should set @email", ->
          @account.email = 'joe@example.com'
          @account._handle_sign_out {"ok":true}
          do expect(@account.email).toBeUndefined
          
        it "should store @email persistantly", ->
          spyOn(@app.store.db, "removeItem")
          @account._handle_sign_out {"ok":true}
          expect(@app.store.db.removeItem).wasCalledWith '_couch.account.email'
          
        it "should set _authenticated to false", ->
          @account._authenticated = true
          @account._handle_sign_out {"ok":true}
          expect(@account._authenticated).toBe false
      # /_handle_sign_out
    # /event handlers
    
    describe ".authenticate()", ->
      
      _when "@email is undefined", ->
        beforeEach ->
          delete @account.email
          @promise = @account.authenticate()
              
        it "should return a promise", ->
          expect(@promise).toBePromise()
          
        it "should reject the promise", ->
          expect(@promise).toBeRejected()
          
      _when "@email is 'joe@example.com", ->
        beforeEach ->
          @account.email = 'joe@example.com'
        
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
            expect(@app.request).wasCalled()
            args = @app.request.mostRecentCall.args
            expect(args[0]).toBe 'GET'
            expect(args[1]).toBe '/_session'
          

          # {"ok":true,"userCtx":{"name":"@example.com","roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"],"authenticated":"cookie"}}
          _when "authentication request is successful and returns joe@example.com", ->
            beforeEach ->
              @app.request.andCallFake (type, path, options = {}) -> options.success? userCtx: name: 'joe@example.com'
              @promise = @account.authenticate()
              
            it "should set account as authenticated", ->
              expect(@account._authenticated).toBe true
              
            it "should resolve the promise with 'joe@example.com'", ->
              expect(@promise).toBeResolvedWith 'joe@example.com'
          
          # {"ok":true,"userCtx":{"name":null,"roles":[]},"info":{"authentication_db":"_users","authentication_handlers":["oauth","cookie","default"]}}
          _when "authentication request is successful and returns `name: joe@example.com`", ->
            beforeEach ->
              @app.request.andCallFake (type, path, options = {}) -> options.success? userCtx: name: null
              @promise = @account.authenticate()
              
            it "should set account as unauthenticated", ->
              expect(@account._authenticated).toBe false
              
            it "should reject the promise", ->
              expect(@promise).toBeRejected()
              
            it "should trigger an `account:error:unauthenticated` event", ->
              expect(@app.trigger).wasCalledWith 'account:error:unauthenticated'
              
          _when "authentication request has an error", ->
            beforeEach ->
              @app.request.andCallFake (type, path, options = {}) -> options.error? 'error data'
              @promise = @account.authenticate()
            
            it "should reject the promise", ->
              expect(@promise).toBeRejectedWith 'error data'
            
              
    # /.authenticate()
  
    describe ".sign_up(email, password)", ->
      beforeEach ->
        @account.sign_up('joe@example.com', 'secret')
        [@type, @path, @options] = @app.request.mostRecentCall.args
        @data = JSON.parse @options.data
    
      it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
        expect(@app.request).wasCalled()
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
        [@type, @path, @options] = @app.request.mostRecentCall.args
        @data = JSON.parse @options.data
        expect(@data.password).toBeUndefined()
      
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
        
        it "should trigger `account:signed_up` event", ->
          @account.sign_up('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:signed_up', 'joe@example.com'
          
        it "should trigger `account:signed_in` event", ->
          @account.sign_up('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:signed_in', 'joe@example.com'
    # /.sign_up(email, password)
  
    describe ".sign_in(email, password)", ->
      beforeEach ->
        @account.sign_in('joe@example.com', 'secret')
        [@type, @path, @options] = @app.request.mostRecentCall.args
    
      it "should send a POST request to http://my.cou.ch/_session", ->
        expect(@app.request).wasCalled()
        expect(@type).toBe 'POST'
        expect(@path).toBe  '/_session'
      
      it "should send email as name parameter", ->
        expect(@options.data.name).toBe 'joe@example.com'
    
      it "should send password", ->
        expect(@options.data.password).toBe 'secret'
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
          
        it "should trigger `account:signed_in` event", ->
          @account.sign_in('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:signed_in', 'joe@example.com'
    # /.sign_in(email, password)
  
    describe ".change_password(email, password)", ->
      it "should have some specs"
    # /.change_password(email, password)
  
    describe ".sign_out()", ->
      beforeEach ->
        @account.sign_out()
        [@type, @path, @options] = @app.request.mostRecentCall.args
    
      it "should send a DELETE request to http://my.cou.ch/_session", ->
        expect(@app.request).wasCalled()
        expect(@type).toBe 'DELETE'
        expect(@path).toBe  '/_session'
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
          
        it "should trigger `account:signed_out` event", ->
          @account.sign_out('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:signed_out'
    # /.sign_in(email, password)
    
    describe ".on(event, callback)", ->
      beforeEach ->
        spyOn(@app, "on")
        
      it "should proxy to @app.on() and namespace with account", ->
        party = jasmine.createSpy 'party'
        @account.on('funky', party)
        (expect @app.on).wasCalledWith('account:funky', party)
    # /.on(event, callback)
    
    describe ".user_db", ->
      _when "email is set to 'joe.doe@example.com'", ->
        beforeEach ->
          @account.email = 'joe.doe@example.com'
        
        it "should return 'joe$example_com", ->
          (expect @account.user_db()).toEqual('joe_doe$example_com')
          
        
  # /Account