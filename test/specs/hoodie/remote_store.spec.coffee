describe "Hoodie.RemoteStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @remote = new Hoodie.RemoteStore @hoodie
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
  
  
  describe ".constructor(@hoodie, options = {})", ->

    it "should set @basePath", ->
      remote = new Hoodie.RemoteStore @hoodie, basePath: '/base/path'
      expect(remote.basePath).toBe '/base/path'

    it "should set _sync to false by default", ->
      remote = new Hoodie.RemoteStore @hoodie
      expect(remote._sync).toBe false

    it "should set _sync to false from pased sync option", ->
      remote = new Hoodie.RemoteStore @hoodie, sync: true
      expect(remote._sync).toBe true
    
    
  # /.constructor


  # object loading / updating / deleting
  # -------------------------------------

  describe "load(type, id)", ->
  # /load(type, id)

  describe "loadAll(type )", ->
  # /loadAll(type )

  describe "create(type, object)", ->
  # /create(type, object)

  describe "save(type, id, object)", ->
  # /save(type, id, object)

  describe "update(new_properties )", ->
  # /update(new_properties )

  describe "updateAll( type, new_properties)", ->
  # /updateAll( type, new_properties)

  describe "delete(type, id)", ->
  # /delete(type, id)

  describe "deleteAll(type)", ->
  # /deleteAll(type)


  # custom requests
  # -----------------

  describe "get(view, params)", ->
  # /get(view, params)
  
  describe "post(view, params)", ->
  # /post(view, params)


  # synchronization
  # -----------------

  describe ".connect()", ->
  # /.connect()

  describe ".disconnect()", -> 
  # /.disconnect()

  describe ".isContinuouslyPulling()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslyPulling()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslyPulling()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return true", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslyPulling()).toBe true

    _when "remote._sync is push: true", ->
      it "should return false", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslyPulling()).toBe false
  # /.isContinuouslySyncing()

  describe ".isContinuouslyPushing()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslyPushing()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslyPushing()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return false", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslyPushing()).toBe false

    _when "remote._sync is push: true", ->
      it "should return true", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslyPushing()).toBe true
  # /.isContinuouslySyncing()

  describe ".isContinuouslySyncing()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslySyncing()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslySyncing()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return false", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslySyncing()).toBe false

    _when "remote._sync is push: true", ->
      it "should return false", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslySyncing()).toBe false
  # /.isContinuouslySyncing()

  describe ".pull()", ->
  # /.pull()

  describe ".push(docs)", -> 
  # /.push(docs)

  describe ".sync(docs)", ->
  # /.sync(docs)


  # event binding
  # ---------------
  
  describe ".on(event, callback)", ->  
    it "should namespace events with `remote`", ->
      cb = jasmine.createSpy 'test'
      @remote.on 'funky', cb
      expect(@hoodie.on).wasCalledWith 'remote:funky', cb
  # /.on(event, callback)
# /Hoodie.RemoteStore