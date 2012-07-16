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