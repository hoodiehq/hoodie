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

  describe "direct call", ->
    beforeEach ->
      spyOn(@hoodie, "open")
    
    it "should init a new share instance", ->
      spyOn(Hoodie, "ShareInstance")
      share = new Hoodie.Share @hoodie
      instance = share('funk123', option: 'value')
      expect(share.instance).wasCalled()
  # /direct call

  describe "#instance", ->
    it "should point to Hoodie.ShareInstance", ->
      share  = new Hoodie.Share @hoodie
      expect(share.instance).toBe Hoodie.ShareInstance
  # /#instance

  describe "#add(attributes)", ->
    beforeEach ->
      @instance      = jasmine.createSpy("instance")
      @instance.save = jasmine.createSpy("save")
      @share.instance.andReturn @instance
    
    it "should initiate a new Hoodie.ShareInstance and save it", ->
      returnValue = @share.add funky: 'fresh'
      expect(@share.instance).wasCalledWith funky: 'fresh'
      expect(@instance.save).wasCalled()
      expect(returnValue).toBe @instance
  # /#add(attributes)

  describe "#find(share_id)", ->
    beforeEach ->
      promise = @hoodie.defer().resolve(funky: 'fresh').promise()
      spyOn(@hoodie.store, "find").andReturn promise
      @share.instance.andCallFake -> this.foo = 'bar'
    
    it "should proxy to store.find('$share', share_id)", ->
      promise = @share.find '123'
      expect(@hoodie.store.find).wasCalledWith '$share', '123'

    it "should resolve with a Share Instance", ->
      @hoodie.store.find.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.find '123'
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#find(share_id)

  describe "#findOrAdd(id, share_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.store, "findOrAdd").andCallThrough()
    
    it "should proxy to hoodie.store.findOrAdd with type set to '$share'", ->
      @share.findOrAdd 'id123', {}
      expect(@hoodie.store.findOrAdd).wasCalledWith '$share', 'id123', {}

    it "should resolve with a Share Instance", ->
      @hoodie.store.findOrAdd.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.findOrAdd 'id123', {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#findOrAdd(share_attributes)

  describe "#findAll()", ->
    beforeEach ->
      spyOn(@hoodie.store, "findAll").andCallThrough()
    
    it "should proxy to hoodie.store.findAll('$share')", ->
      @hoodie.store.findAll.andCallThrough()
      @share.findAll()
      expect(@hoodie.store.findAll).wasCalledWith '$share'

    it "should resolve with an array of Share instances", ->
      @hoodie.store.findAll.andReturn @hoodie.defer().resolve([{}, {}]).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.findAll()
      expect(promise).toBeResolvedWith [{foo: 'bar'}, {foo: 'bar'}]
  # /#findAll()

  describe "#save('share_id', attributes)", ->
    beforeEach ->
      spyOn(@hoodie.store, "save").andCallThrough()
    
    it "should proxy to hoodie.store.save('$share', 'share_id', attributes)", ->
      @share.save('abc4567', funky: 'fresh')
      expect(@hoodie.store.save).wasCalledWith '$share', 'abc4567', funky: 'fresh'

    it "should resolve with a Share Instance", ->
      @hoodie.store.save.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.save {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#save('share_id', attributes)

  describe "#update('share_id', changed_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.store, "update").andCallThrough()
    
    it "should proxy to hoodie.store.update('$share', 'share_id', attributes)", ->
      @share.update('abc4567', funky: 'fresh')
      expect(@hoodie.store.update).wasCalledWith '$share', 'abc4567', funky: 'fresh'

    it "should resolve with a Share Instance", ->
      @hoodie.store.update.andReturn @hoodie.defer().resolve({}).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.update {}
      expect(promise).toBeResolvedWith foo: 'bar'
  # /#update('share_id', changed_attributes)


  describe "#updateAll(changed_attributes)", ->
    beforeEach ->
      spyOn(@hoodie.store, "updateAll").andCallThrough()
    
    it "should proxy to hoodie.store.updateAll('$share', changed_attributes)", ->
      @hoodie.store.updateAll.andCallThrough()
      @share.updateAll( funky: 'fresh' )
      expect(@hoodie.store.updateAll).wasCalledWith '$share', funky: 'fresh'

    it "should resolve with an array of Share instances", ->
      @hoodie.store.updateAll.andReturn @hoodie.defer().resolve([{}, {}]).promise()
      @share.instance.andCallFake -> this.foo = 'bar'
      promise = @share.updateAll funky: 'fresh'
      expect(promise).toBeResolvedWith [{foo: 'bar'}, {foo: 'bar'}]
  # /#findAll()


  describe "#remove(share_id)", ->
    beforeEach ->
      spyOn(@hoodie.store, "findAll").andReturn unshareAt: ->
      spyOn(@hoodie.store, "remove").andReturn 'remove_promise'

    it "should init the share instance and remove it", ->
      promise = @share.remove '123'
      expect(promise).toBe 'remove_promise'
  # /#remove(share_id)


  describe "#removeAll()", ->
    beforeEach ->
      spyOn(@hoodie.store, "findAll").andReturn unshare: ->
      spyOn(@hoodie.store, "removeAll").andReturn 'remove_promise'

    it "should init the share instance and remove it", ->
      promise = @share.removeAll()
      expect(promise).toBe 'remove_promise'
  # /#removeAll()

  describe "hoodie.store promise decorations", ->
    beforeEach ->
      @storeDefer = @hoodie.defer()
      spyOn(@hoodie.store, "update")
    
    describe "#shareAt(shareId, properties)", ->
      _when "promise returns one object", ->
        beforeEach ->
          @storeDefer.resolve
            $type: 'task'
            id: '123'
            title: 'milk'

        _and "no properties passed", ->
          it "should save object returned by promise with {$shares: {shareId: true}}", ->
            Hoodie.Share::_storeShareAt(@hoodie).apply(@storeDefer.promise(), ['shareId'])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$shares: {shareId: true}}

        _and "properties passed as array", ->
          it "should save object returned by promise with {$shares: {shareId: ['title', 'owner']}}", ->
            @storeDefer.resolve({$type: 'task', id: '123', title: 'milk'})

            properties = ['title', 'owner']
            Hoodie.Share::_storeShareAt(@hoodie).apply(@storeDefer.promise(), ['shareId', properties])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$shares: {shareId: ['title', 'owner']}}

      _when "promise returns multiple objects", ->
        beforeEach ->
          @storeDefer.resolve [
            {$type: 'task', id: '123', title: 'milk'}
            {$type: 'task', id: '456', title: 'milk'}
          ]

        _and "no properties passed", ->
          it "should update object returned by promise with $public: true", ->
            Hoodie.Share::_storeShareAt(@hoodie).apply(@storeDefer.promise(), ['shareId'])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$shares: {shareId: true}}
            expect(@hoodie.store.update).wasCalledWith 'task', '456', {$shares: {shareId: true}}

        _and "properties passed as array", ->
          it "should update object returned by promise with $public: ['title', 'owner']", ->
            properties = ['title', 'owner']
            Hoodie.Share::_storeShareAt(@hoodie).apply(@storeDefer.promise(), ['shareId', properties])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$shares: {shareId: ['title', 'owner']}}
            expect(@hoodie.store.update).wasCalledWith 'task', '456', {$shares: {shareId: ['title', 'owner']}}
    # /shareAt()

    describe "#unshareAt(shareId)", ->
      _when "object is currently shared at 'shareId'", ->
        beforeEach ->
          @storeDefer.resolve 
            $type: 'task'
            id: '123'
            title: 'milk'
            $shares: {shareId: true}
        
        it "should save object returned by promise with {$shares: {shareId: false}}", ->
          Hoodie.Share::_storeUnshareAt(@hoodie).apply(@storeDefer.promise(), ['shareId'])
          expect(@hoodie.store.update).wasCalledWith 'task', '123', {$shares: {shareId: false}}

      _when "promise returns multiple objects, of which some are shared at 'shareId'", ->
        beforeEach ->
          @storeDefer.resolve [
            {$type: 'task', id: '123', title: 'milk'}
            {$type: 'task', id: '456', title: 'milk', $shares: {shareId: true}}
            {$type: 'task', id: '789', title: 'milk', $shares: {shareId: ['title', 'owner']}}
          ]

        it "should update objects returned by promise with {$shares: {shareId: false}}", ->
          Hoodie.Share::_storeUnshareAt(@hoodie).apply(@storeDefer.promise(), ['shareId'])
          expect(@hoodie.store.update).wasNotCalledWith 'task', '123', {$shares: {shareId: false}}
          expect(@hoodie.store.update).wasCalledWith 'task', '456', {$shares: {shareId: false}}
          expect(@hoodie.store.update).wasCalledWith 'task', '789', {$shares: {shareId: false}}
    # /#unshareAt()
  # /hoodie.store promise decorations