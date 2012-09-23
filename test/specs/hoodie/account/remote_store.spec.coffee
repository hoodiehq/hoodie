describe "Hoodie.Account.RemoteStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
    spyOn(window, "setTimeout")
    spyOn(@hoodie.my.account, "db").andReturn 'userhash123'
    
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie.my.store, "destroy").andReturn then: (cb) -> cb('objectFromStore')
    spyOn(@hoodie.my.store, "update").andReturn  then: (cb) -> cb('objectFromStore', false)

    @remote = new Hoodie.Account.RemoteStore @hoodie
  
  
  describe ".constructor(@hoodie, options = {})", ->
    beforeEach ->
      @remote = new Hoodie.Account.RemoteStore @hoodie
    
    it "should set name to users database name", ->
      expect(@remote.name).toBe "userhash123"

    it "should sync continously by default", ->
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
    
    it "should start syncing", ->
      spyOn(Hoodie.Account.RemoteStore::, "startSyncing")
      new Hoodie.Account.RemoteStore @hoodie
      expect(Hoodie.Account.RemoteStore::startSyncing).wasCalled()
        
    _when "config remote.sync is false", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andReturn false
        @remote = new Hoodie.Account.RemoteStore @hoodie
        
      it "should set syncContinuously to false", ->
        expect(@remote.isContinuouslySyncing()).toBe false

      it "should not start syncing", ->
        spyOn(Hoodie.Account.RemoteStore::, "startSyncing")
        new Hoodie.Account.RemoteStore @hoodie
        expect(Hoodie.Account.RemoteStore::startSyncing).wasNotCalled()
      
     

  describe ".startSyncing", ->
    it "should make isContinuouslySyncing() to return true", ->
      @remote._sync = false
      @remote.startSyncing()
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
    
    it "should set config _remote.sync to true", ->
      spyOn(@hoodie.my.config, "set")
      @remote.startSyncing()
      expect(@hoodie.my.config.set).wasCalledWith '_remote.sync', true

    it "should subscribe to `signout` event", ->
      @remote.startSyncing()
      expect(@hoodie.on).wasCalledWith 'account:signout', @remote.disconnect

    it "should subscribe to account:signin with sync", ->
      @remote.startSyncing()
      expect(@hoodie.on).wasCalledWith 'account:signin', @remote.connect
      
  describe ".stopSyncing", ->
    it "should set _remote.sync to false", ->
      @remote._sync = true
      @remote.stopSyncing()
      expect(@remote.isContinuouslySyncing()).toBeFalsy()
    
    it "should set config remote.syncContinuously to false", ->
      spyOn(@hoodie.my.config, "set")
      @remote.stopSyncing()
      expect(@hoodie.my.config.set).wasCalledWith '_remote.sync', false

    it "should unsubscribe from account's signin idle event", ->
      @remote.stopSyncing()
      expect(@hoodie.unbind).wasCalledWith 'account:signin', @remote.connect
      
    it "should unsubscribe from account's signout idle event", ->
      @remote.stopSyncing()
      expect(@hoodie.unbind).wasCalledWith 'account:signout', @remote.disconnect

  describe ".connect()", ->
    beforeEach ->
      spyOn(@remote, "sync")
      
    it "should authenticate", ->
      spyOn(@hoodie.my.account, "authenticate").andCallThrough()
      @remote.connect()
      expect(@hoodie.my.account.authenticate).wasCalled()
      
    _when "successful", ->
      beforeEach ->
        spyOn(@hoodie.my.account, "authenticate").andReturn pipe: (cb) -> 
          cb()
          fail: ->
        
      it "should call super", ->
        spyOn(Hoodie.RemoteStore::, "connect")
        @remote.connect()
        expect(Hoodie.RemoteStore::connect).wasCalled()
  # /.connect()

  describe ".getSinceNr()", ->
    beforeEach ->
      spyOn(@hoodie.my.config, "get")
    
    it "should use user's config to get since nr", ->
      @remote.getSinceNr()
      expect(@hoodie.my.config.get).wasCalledWith '_remote.since'

    _when "config _remote.since is not defined", ->
      beforeEach ->
        @hoodie.my.config.get.andReturn undefined

      it "should return 0", ->
        expect(@remote.getSinceNr()).toBe 0
  # /.getSinceNr()

  describe ".setSinceNr(nr)", ->
    beforeEach ->
      spyOn(@hoodie.my.config, "set")

    it "should use user's config to store since nr persistantly", ->
      @remote.setSinceNr(100)
      expect(@hoodie.my.config.set).wasCalledWith '_remote.since', 100
  # /.setSinceNr()

  describe ".push(docs)", -> 
    beforeEach ->
      spyOn(Hoodie.RemoteStore::, "push")

    _when "no docs passed", ->        
      it "should push changed documents from store", ->
        spyOn(@hoodie.my.store, "changedDocs").andReturn "changed_docs"
        @remote.push()
        expect(Hoodie.RemoteStore::push).wasCalledWith "changed_docs"
  # /.push(docs)
# /Hoodie.Account.RemoteStore