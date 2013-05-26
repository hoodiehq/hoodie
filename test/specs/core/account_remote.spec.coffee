describe "Hoodie.AccountRemote", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
    spyOn(window, "setTimeout")
    spyOn(@hoodie.account, "db").andReturn 'userhash123'
    
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie, "checkConnection")
    spyOn(@hoodie.store, "remove").andReturn then: (cb) -> cb('objectFromStore')
    spyOn(@hoodie.store, "update").andReturn then: (cb) -> cb('objectFromStore', false)
    spyOn(@hoodie.store, "save").andReturn   then: (cb) -> cb('objectFromStore', false)

    @remote = new Hoodie.AccountRemote @hoodie
  
  
  describe "constructor(@hoodie, options = {})", ->
    beforeEach ->
      spyOn(Hoodie.AccountRemote::, "disconnect")
      spyOn(Hoodie.AccountRemote::, "connect")
      @remote = new Hoodie.AccountRemote @hoodie
    
    it "should set name to users database name", ->
      expect(@remote.name).toBe "userhash123"

    it "should be connected by default", ->
      expect(@remote.isConnected()).toBeTruthy()
        
    it "should connect", ->
      expect(Hoodie.AccountRemote::connect).wasCalled()

    it "should subscribe to `reauthenticated` event", ->
      # that does not work because the callback has been spied on, therefore the workaround
      # expect(@hoodie.on).wasCalledWith 'account:signout', @remote.disconnect
      for call in @hoodie.on.calls when call.args[0] is 'account:reauthenticated'
        call.args[1]()

      expect(Hoodie.AccountRemote::connect).wasCalled()

    it "should subscribe to `signout` event", ->
      # that does not work because the callback has been spied on I guess,
      # therefore the workaround expect(@hoodie.on).wasCalledWith 'account:signout',
      # @remote.disconnect
      for call in @hoodie.on.calls when call.args[0] is 'account:signout'
        call.args[1]()

      expect(Hoodie.AccountRemote::disconnect).wasCalled()
      
    it "should set connected to true", ->
      expect(@remote.isConnected()).toBe true

    it "should subscribe to `reconnected` event", ->
      # that does not work for what ever reason, therefore the workaround
      # expect(@hoodie.on).wasCalledWith 'reconnected', @remote.connect
      for call in @hoodie.on.calls when call.args[0] is 'reconnected'
        call.args[1]()

      expect(Hoodie.AccountRemote::connect).wasCalled()

  describe "#connect()", ->
    beforeEach ->
      @authenticateDefer = @hoodie.defer()
      spyOn(@hoodie.account, "authenticate").andReturn @authenticateDefer.promise()
      
    it "should authenticate", ->
      @remote.connect()
      expect(@hoodie.account.authenticate).wasCalled()
      
    _when "successfully authenticated", ->
      beforeEach ->
        @authenticateDefer.resolve()
      
      it "should set connected to true", ->
        @remote.connected = false
        @remote.connect()
        expect(@remote.connected).toBe true

      it "should subscribe to store:idle event", ->
        @remote.connect()
        expect(@hoodie.on).wasCalledWith 'store:idle', @remote.push

      _and "user signs in, it should connect", ->
        beforeEach ->
          @remote.connected = false
          spyOn(@remote, "connect")
          @remote._handleSignIn()

        it "should connect", ->
          expect(@remote.connected).toBe true
  # /#connect()


  describe "#disconnect()", ->
    it "should unsubscribe from stores's dirty idle event", ->
      @remote.disconnect()
      expect(@hoodie.unbind).wasCalledWith 'store:idle', @remote.push

    it "should set connected to false", ->
      @remote.disconnect()
      expect(@remote.isConnected()).toBeFalsy()
  # /#disconnect()

  describe "#getSinceNr()", ->
    beforeEach ->
      spyOn(@hoodie.config, "get")
    
    it "should use user's config to get since nr", ->
      @remote.getSinceNr()
      expect(@hoodie.config.get).wasCalledWith '_remote.since'

    _when "config _remote.since is not defined", ->
      beforeEach ->
        @hoodie.config.get.andReturn undefined

      it "should return 0", ->
        expect(@remote.getSinceNr()).toBe 0
  # /#getSinceNr()


  describe "#setSinceNr(nr)", ->
    beforeEach ->
      spyOn(@hoodie.config, "set")

    it "should use user's config to store since nr persistantly", ->
      @remote.setSinceNr(100)
      expect(@hoodie.config.set).wasCalledWith '_remote.since', 100
  # /#setSinceNr()


  describe "#pull()", ->        
    beforeEach ->
      @remote.connected = true
      spyOn(@remote, "request").andReturn @requestDefer.promise()
    
    _when ".isConnected() is true", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn true
      
      it "should send a longpoll GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll'
        
      it "should set a timeout to restart the pull request", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote._restartPullRequest, 25000
        
    _when ".isConnected() is false", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn false
      
      it "should send a normal GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&since=0'

    _when "request is successful / returns changes", ->
      beforeEach ->
        @remote.request.andReturn then: (success) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          success Mocks.changesResponse()
        
      _and ".isConnected() returns true", ->
        beforeEach ->
          spyOn(@remote, "isConnected").andReturn true
          spyOn(@remote, "pull").andCallThrough()
        
        it "should pull again", ->
          @remote.pull()
          expect(@remote.pull.callCount).toBe 2
        
    _when "request errors with 401 unauthorzied", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 401, 'error object'
          
        spyOn(@remote, "disconnect")
      
      it "should disconnect", ->
        @remote.pull()
        expect(@remote.disconnect).wasCalled()
        
      it "should trigger an unauthenticated error", ->
        spyOn(@remote, "trigger")
        @remote.pull()
        expect(@remote.trigger).wasCalledWith 'error:unauthenticated', 'error object'
      
      _and "remote is pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = true
      
      _and "remote isn't pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = false


    _when "request errors with 401 unauthorzied", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 401, 'error object'
          
        spyOn(@remote, "disconnect")
      
      it "should disconnect", ->
        @remote.pull()
        expect(@remote.disconnect).wasCalled()
        
      it "should trigger an unauthenticated error", ->
        spyOn(@remote, "trigger")
        @remote.pull()
        expect(@remote.trigger).wasCalledWith 'error:unauthenticated', 'error object'
      
      _and "remote is pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = true
      
      _and "remote isn't pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = false


    _when "request errors with 404 not found", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 404, 'error object'
        
      it "should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000

    _when "request errors with 500 oooops", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 500, 'error object'
      
      it "should try again in 3 seconds (and hope it was only a hiccup ...)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
      it "should trigger a server error event", ->
        spyOn(@remote, "trigger")
        @remote.pull()
        expect(@remote.trigger).wasCalledWith 'error:server', 'error object'
        
    _when "request was aborted manually", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error statusText: 'abort', 'error object'
      
      it "should try again when .isConnected() returns true", ->
        spyOn(@remote, "pull").andCallThrough()
        spyOn(@remote, "isConnected").andReturn true
        @remote.pull()
        expect(@remote.pull.callCount).toBe 2
        
        @remote.pull.reset()
        @remote.isConnected.andReturn false
        @remote.pull()
        expect(@remote.pull.callCount).toBe 1

    _when "there is a different error", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error {}, 'error object'
          
      it "should try again in 3 seconds if .isConnected() returns false", ->
        spyOn(@remote, "isConnected").andReturn true
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
        window.setTimeout.reset()
        @remote.isConnected.andReturn false
        @remote.pull()
        expect(window.setTimeout).wasNotCalledWith @remote.pull, 3000
  # /#pull()


  describe "#push(docs)", -> 
    beforeEach ->
      @pushDefer = @hoodie.defer()
      spyOn(Hoodie.Remote::, "push").andReturn @pushDefer.promise()

    _when "disconnected", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn false

      it "should reject with pushError", ->
        promise = @remote.push [{type: 'todo', id: '1'}]
        errorCalled = false
        promise.fail (error) ->
          errorCalled = true
          {name, message, data} = error

          expect(name).toBe 'ConnectionError'
          expect(message).toBe 'Not connected: could not push local changes to remote'

        expect(errorCalled).toBeTruthy()
         
    _when "connected", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn true

      _and "no docs passed", ->        
        it "should push changed documents from store", ->
          spyOn(@hoodie.store, "changedObjects").andReturn "changed_docs"
          @remote.push()
          expect(Hoodie.Remote::push).wasCalledWith "changed_docs"

      _and "push fails", ->
        beforeEach ->
          @pushDefer.reject()

        it "should check connection", -> 
          @remote.push()
          expect(@hoodie.checkConnection).wasCalled()
  # /#push(docs)


  describe "#on", ->
    it "should namespace bindings with 'remote'", ->
      @remote.on 'funk', 'check'
      expect(@hoodie.on).wasCalledWith 'remote:funk', 'check'

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @remote.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'remote:super remote:funky remote:fresh', cb
  # /#on


  describe "#one", ->
    it "should namespace bindings with 'remote'", ->
      @remote.one 'funk', 'check'
      expect(@hoodie.one).wasCalledWith 'remote:funk', 'check'

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @remote.one 'super funky fresh', cb
      expect(@hoodie.one).wasCalledWith 'remote:super remote:funky remote:fresh', cb
  # /#one


  describe "#trigger", ->
    it "should namespace bindings with 'remote'", ->
      @remote.trigger 'funk', 'check'
      expect(@hoodie.trigger).wasCalledWith 'remote:funk', 'check'
  # /#trigger
# /Hoodie.AccountRemote
