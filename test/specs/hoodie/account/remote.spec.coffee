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
    spyOn(@hoodie.store, "remove").andReturn then: (cb) -> cb('objectFromStore')
    spyOn(@hoodie.store, "update").andReturn  then: (cb) -> cb('objectFromStore', false)
    spyOn(@hoodie.store, "save").andReturn    then: (cb) -> cb('objectFromStore', false)

    @remote = new Hoodie.AccountRemote @hoodie
  
  
  describe "constructor(@hoodie, options = {})", ->
    beforeEach ->
      @remote = new Hoodie.AccountRemote @hoodie
    
    it "should set name to users database name", ->
      expect(@remote.name).toBe "userhash123"

    it "should sync continously by default", ->
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
        
    it "should start syncing", ->
      spyOn(Hoodie.AccountRemote::, "startSyncing")
      new Hoodie.AccountRemote @hoodie
      expect(Hoodie.AccountRemote::startSyncing).wasCalled()
      
    _when "config remote.sync is false", ->
      beforeEach ->
        spyOn(@hoodie.config, "get").andReturn false
        @remote = new Hoodie.AccountRemote @hoodie
        
      it "should set syncContinuously to false", ->
        expect(@remote.isContinuouslySyncing()).toBe false

      it "should not start syncing", ->
        spyOn(Hoodie.AccountRemote::, "startSyncing")
        new Hoodie.AccountRemote @hoodie
        expect(Hoodie.AccountRemote::startSyncing).wasNotCalled()
     

  describe "#startSyncing", ->
    it "should make isContinuouslySyncing() to return true", ->
      @remote._sync = false
      @remote.startSyncing()
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
    
    it "should set config _remote.sync to true", ->
      spyOn(@hoodie.config, "set")
      @remote.startSyncing()
      expect(@hoodie.config.set).wasCalledWith '_remote.sync', true

    it "should subscribe to `signout` event", ->
      @remote.startSyncing()
      expect(@hoodie.on).wasCalledWith 'account:signout', @remote.disconnect

    it "should subscribe to account:signin with sync", ->
      @remote.startSyncing()
      expect(@hoodie.on).wasCalledWith 'account:signin', @remote._handleSignIn

    it "should connect", ->
      spyOn(@remote, "connect")
      @remote.startSyncing()
      expect(@remote.connect).wasCalled()
  # /#startSyncing()
      

  describe "#stopSyncing", ->
    it "should set _remote.sync to false", ->
      @remote._sync = true
      @remote.stopSyncing()
      expect(@remote.isContinuouslySyncing()).toBeFalsy()
    
    it "should set config remote.syncContinuously to false", ->
      spyOn(@hoodie.config, "set")
      @remote.stopSyncing()
      expect(@hoodie.config.set).wasCalledWith '_remote.sync', false

    it "should unsubscribe from account's signin idle event", ->
      @remote.stopSyncing()
      expect(@hoodie.unbind).wasCalledWith 'account:signin', @remote._handleSignIn
      
    it "should unsubscribe from account's signout idle event", ->
      @remote.stopSyncing()
      expect(@hoodie.unbind).wasCalledWith 'account:signout', @remote.disconnect
  # /#stopSyncing()

  describe "#connect()", ->
    beforeEach ->
      spyOn(@remote, "sync")
      
    it "should authenticate", ->
      spyOn(@hoodie.account, "authenticate").andCallThrough()
      @remote.connect()
      expect(@hoodie.account.authenticate).wasCalled()
      
    _when "successful", ->
      beforeEach ->
        spyOn(@hoodie.account, "authenticate").andReturn pipe: (cb) -> 
          cb()
          fail: ->
        
      it "should call super", ->
        spyOn(Hoodie.Remote::, "connect")
        @remote.connect()
        expect(Hoodie.Remote::connect).wasCalled()
  # /#connect()

  describe "#disconnect()", ->
    it "should unsubscribe from stores's dirty idle event", ->
      @remote.disconnect()
      expect(@hoodie.unbind).wasCalledWith 'store:idle', @remote.push
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
    
    _when ".isContinuouslyPulling() is true", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn true
      
      it "should send a longpoll GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll'
        
      it "should set a timeout to restart the pull request", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote._restartPullRequest, 25000
        
    _when ".isContinuouslyPulling() is false", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn false
      
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
      
      it "should remove `todo/abc3` from store", ->
        @remote.pull()
        expect(@hoodie.store.remove).wasCalledWith 'todo', 'abc3', remote: true

      it "should save `todo/abc2` in store", ->
        @remote.pull()
        expect(@hoodie.store.save).wasCalledWith 'todo', 'abc2', { _rev : '1-123', content : 'remember the milk', done : false, order : 1, $type : 'todo', id : 'abc2' }, { remote : true }
      
      it "should trigger remote events", ->
        spyOn(@remote, "trigger")
        @remote.pull()

        # {"_id":"todo/abc3","_rev":"2-123","_deleted":true}
        expect(@remote.trigger).wasCalledWith 'remove',           'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'remove:todo',      'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'remove:todo:abc3', 'objectFromStore'

        expect(@remote.trigger).wasCalledWith 'change',            'remove', 'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'change:todo',       'remove', 'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'change:todo:abc3',  'remove', 'objectFromStore'        
        
        # {"_id":"todo/abc2","_rev":"1-123","content":"remember the milk","done":false,"order":1, "type":"todo"}
        expect(@remote.trigger).wasCalledWith 'update',            'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'update:todo',       'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'update:todo:abc2',  'objectFromStore'

        expect(@remote.trigger).wasCalledWith 'change',            'update', 'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'change:todo',       'update', 'objectFromStore'
        expect(@remote.trigger).wasCalledWith 'change:todo:abc2',  'update', 'objectFromStore'
        
      _and ".isContinuouslyPulling() returns true", ->
        beforeEach ->
          spyOn(@remote, "isContinuouslyPulling").andReturn true
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
      
      it "should try again when .isContinuouslyPulling() returns true", ->
        spyOn(@remote, "pull").andCallThrough()
        spyOn(@remote, "isContinuouslyPulling").andReturn true
        @remote.pull()
        expect(@remote.pull.callCount).toBe 2
        
        @remote.pull.reset()
        @remote.isContinuouslyPulling.andReturn false
        @remote.pull()
        expect(@remote.pull.callCount).toBe 1

    _when "there is a different error", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error {}, 'error object'
          
      it "should try again in 3 seconds if .isContinuouslyPulling() returns false", ->
        spyOn(@remote, "isContinuouslyPulling").andReturn true
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
        window.setTimeout.reset()
        @remote.isContinuouslyPulling.andReturn false
        @remote.pull()
        expect(window.setTimeout).wasNotCalledWith @remote.pull, 3000
  # /#pull()


  describe "#sync(docs)", ->
    beforeEach ->
      spyOn(@remote, "push").andCallFake (docs) -> pipe: (cb) -> cb(docs)
      spyOn(@remote, "pull")
      
    _when ".isContinuouslyPushing() returns true", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPushing").andReturn true
        
      it "should bind to store:idle event", ->
        @remote.sync()
        expect(@hoodie.on).wasCalledWith 'store:idle', @remote.push
        
      it "should unbind from store:idle event before it binds to it", ->
        order = []
        @hoodie.unbind.andCallFake (event) -> order.push "unbind #{event}"
        @hoodie.on.andCallFake (event) -> order.push "bind #{event}"
        @remote.sync()
        expect(order[0]).toBe 'unbind store:idle'
        expect(order[1]).toBe 'bind store:idle'
  # /#sync(docs)


  describe "#push(docs)", -> 
    beforeEach ->
      @pushDefer = @hoodie.defer()
      spyOn(Hoodie.Remote::, "push").andReturn @pushDefer.promise()

    _when "no docs passed", ->        
      it "should push changed documents from store", ->
        spyOn(@hoodie.store, "changedDocs").andReturn "changed_docs"
        @remote.push()
        expect(Hoodie.Remote::push).wasCalledWith "changed_docs"
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
