describe "Hoodie.Share", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie
    @share  = new Hoodie.Share @hoodie
    spyOn(@share, "instance")

  describe "constructor", ->
    it "should set Hoodie.ShareInstance.prototype.hoodie", ->
      new Hoodie.Share @hoodie
      instance = new Hoodie.ShareInstance
      expect(instance.hoodie).toBe @hoodie

    it "should return the @open method as api", ->
      spyOn(Hoodie.Share::, "open")
      share = new Hoodie.Share @hoodie
      share('funk')
      expect(Hoodie.Share::open).wasCalledWith 'funk'
  # /constructor

  describe "direct call", ->
    beforeEach ->
      spyOn(Hoodie.Share::, "open")
    
    it "should initiate a new Share Instance and pass options", ->
      share = new Hoodie.Share @hoodie
      share('funk')
      expect(Hoodie.Share::open).wasCalledWith 'funk'
  # /('share_id', options)

  describe "#instance", ->
    it "should point to Hoodie.ShareInstance", ->
      share  = new Hoodie.Share @hoodie
      expect(share.instance).toBe Hoodie.ShareInstance
  # /#instance

  describe "#open(shareId, options)", ->
    beforeEach ->
      spyOn(@hoodie, "open")
    
    it "should proxy to hoodie.open('share/' + shareId, {prefix: 'share/shareId'}) and pass options", ->
      @share('funk123', option: 'value')
      expect(@hoodie.open).wasCalledWith 'share/funk123', prefix: 'share/funk123', option: 'value'
  # /#open(shareId, options)

  describe "#create(attributes)", ->
    beforeEach ->
      @instance      = jasmine.createSpy("instance")
      @instance.save = jasmine.createSpy("save")
      @share.instance.andReturn @instance
    
    it "should initiate a new Hoodie.ShareInstance and save it", ->
      returnValue = @share.create funky: 'fresh'
      expect(@share.instance).wasCalledWith funky: 'fresh'
      expect(@instance.save).wasCalled()
      expect(returnValue).toBe @instance
  # /#create(attributes)

  describe "#find(share_id)", ->
    beforeEach ->
      promise = @hoodie.defer().resolve(funky: 'fresh').promise()
      spyOn(@hoodie.my.store, "find").andReturn promise
      @share.instance.andCallFake -> this.foo = 'bar'
    
    it "should proxy to store.find('$share', share_id)", ->
      promise = @share.find '123'
      expect(@hoodie.my.store.find).wasCalledWith '$share', '123'

    it "should resolve with a Share Instance", ->
      @hoodie.my.store.find.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.find '123'
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#find(share_id)

  describe "#findOrCreate(id, share_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "findOrCreate").andCallThrough()
    
    it "should proxy to hoodie.my.store.findOrCreate with type set to '$share'", ->
      @share.findOrCreate 'id123', {}
      expect(@hoodie.my.store.findOrCreate).wasCalledWith '$share', 'id123', {}

    it "should resolve with a Share Instance", ->
      @hoodie.my.store.findOrCreate.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.findOrCreate 'id123', {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#findOrCreate(share_attributes)

  describe "#findAll()", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "findAll").andCallThrough()
    
    it "should proxy to hoodie.my.store.findAll('$share')", ->
      @hoodie.my.store.findAll.andCallThrough()
      @share.findAll()
      expect(@hoodie.my.store.findAll).wasCalledWith '$share'

    it "should resolve with an array of Share instances", ->
      @hoodie.my.store.findAll.andReturn @hoodie.defer().resolve([{}, {}]).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.findAll()
      expect(promise).toBeResolvedWith [{foo: 'bar'}, {foo: 'bar'}]
  # /#findAll()

  describe "#save('share_id', attributes)", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "save").andCallThrough()
    
    it "should proxy to hoodie.my.store.save('$share', 'share_id', attributes)", ->
      @share.save('abc4567', funky: 'fresh')
      expect(@hoodie.my.store.save).wasCalledWith '$share', 'abc4567', funky: 'fresh'

    it "should resolve with a Share Instance", ->
      @hoodie.my.store.save.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.save {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#save('share_id', attributes)

  describe "#update('share_id', changed_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "update").andCallThrough()
    
    it "should proxy to hoodie.my.store.update('$share', 'share_id', attributes)", ->
      @share.update('abc4567', funky: 'fresh')
      expect(@hoodie.my.store.update).wasCalledWith '$share', 'abc4567', funky: 'fresh'

    it "should resolve with a Share Instance", ->
      @hoodie.my.store.update.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.update {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#update('share_id', changed_attributes)


  describe "#updateAll(changed_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "updateAll").andCallThrough()
    
    it "should proxy to hoodie.my.store.updateAll('$share', changed_attributes)", ->
      @hoodie.my.store.updateAll.andCallThrough()
      @share.updateAll( funky: 'fresh' )
      expect(@hoodie.my.store.updateAll).wasCalledWith '$share', funky: 'fresh'

    it "should resolve with an array of Share instances", ->
      @hoodie.my.store.updateAll.andReturn @hoodie.defer().resolve([{}, {}]).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.updateAll funky: 'fresh'
      expect(promise).toBeResolvedWith [{foo: 'bar'}, {foo: 'bar'}]
  # /#findAll()


  describe "#destroy(share_id)", ->
    beforeEach ->
      promise = @hoodie.defer().resolve(funky: 'fresh').promise()
      spyOn(@hoodie.my.store, "find").andReturn promise

      class @share.instance
        destroy: -> 'delete_promise'
    
    it "should try to find the object with store.find('$share', share_id)", ->
      promise = @share.destroy '123'
      expect(@hoodie.my.store.find).wasCalledWith '$share', '123'

    it "should init the share instance and destroy it", ->
      @hoodie.my.store.find.andReturn @hoodie.defer().resolve({}).promise()
      promise = @share.destroy '123'
      expect(promise).toBeResolvedWith 'delete_promise'
  # /#destroy(share_id)


  describe "#destroyAll()", ->
    beforeEach ->
      promise = @hoodie.defer().resolve([{funky: 'fresh'}, {funky: 'fresh'}]).promise()
      spyOn(@hoodie.my.store, "findAll").andReturn promise

      class @share.instance
        destroy: -> 'destroyAll_promise'
    
    it "should try to find the object with store.findAll('$share')", ->
      promise = @share.destroyAll()
      expect(@hoodie.my.store.findAll).wasCalled()

    it "should init the share instance and destroy it", ->
      @hoodie.my.store.findAll.andReturn @hoodie.defer().resolve([{}, {}]).promise()
      promise = @share.destroyAll()
      expect(promise).toBeResolvedWith ['destroyAll_promise', 'destroyAll_promise']
  # /#destroyAll()