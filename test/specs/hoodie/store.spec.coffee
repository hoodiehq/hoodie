describe "Hoodie.Store", -> 
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @store  = new Hoodie.Store @hoodie

  describe "#save(type, id, object, options)", ->
    beforeEach ->
      spyOn(@store, "_now").andReturn 'now'
    
    it "should return a defer", ->
      promise = @store.save 'document', '123', name: 'test'
      expect(promise).toBeDefer()

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should be rejected", ->
          expect(@store.save()).toBeRejected()
  
      _when "no object passed", ->
        it "should be rejected", ->
          promise = @store.save 'document', 'abc4567'
          expect(promise).toBeRejected()
  
    it "should allow numbers and lowercase letters for type only. And must start with a letter or $", ->
      invalid = ['UPPERCASE', 'underLines', '-?&$', '12345', 'a']
      valid   = ['car', '$email']
      
      for key in invalid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeRejected()
       
      for key in valid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeDefer()
    
    it "should allow numbers, lowercase letters and dashes for for id only", ->
      invalid = ['UPPERCASE', 'underLines', '-?&$']
      valid   = ['abc4567', '1', 123, 'abc-567']
  
      for key in invalid
        promise = @store.save 'valid', key, {}
        expect(promise).toBeRejected()
      
      for key in valid
        promise = @store.save 'valid', key, {}
        expect(promise).toBeDefer()

  
  describe "create(type, object)", ->
    beforeEach ->
      spyOn(@store, "save").andReturn "save_promise"

    it "should proxy to save method", ->
      @store.create("test", {funky: "value"})
      expect(@store.save).wasCalledWith "test", undefined, funky: "value"

    it "should return promise of save method", ->
      expect(@store.create()).toBe 'save_promise'
  # /create(type, object)

  describe "#update(type, id, update, options)", ->
    beforeEach ->
      spyOn(@store, "find")
      spyOn(@store, "save").andReturn then: ->
    
    _when "object cannot be found", ->
      beforeEach ->
        @store.find.andReturn $.Deferred().reject()
        @promise = @store.update 'couch', '123', funky: 'fresh'
      
      it "should create it", ->
        expect(@store.save).wasCalledWith 'couch', '123', funky: 'fresh', {}
    
    _when "object can be found", ->
      beforeEach ->
        @store.find.andReturn $.Deferred().resolve { style: 'baws' }
        @store.save.andReturn $.Deferred().resolve 'resolved by save'
        
      _and "update is an object", ->
        beforeEach ->
          @promise = @store.update 'couch', '123', { funky: 'fresh' }
      
        it "should save the updated object", ->
          expect(@store.save).wasCalledWith 'couch', '123', { style: 'baws', funky: 'fresh' }, {}
      
        it "should return a resolved promise", ->
          expect(@promise).toBeResolvedWith 'resolved by save'
        
      _and "update is a function", ->
        beforeEach ->
          @promise = @store.update 'couch', '123', (obj) -> funky: 'fresh'

        it "should save the updated object", ->
          expect(@store.save).wasCalledWith 'couch', '123', { style: 'baws', funky: 'fresh' }, {}

        it "should return a resolved promise", ->
          expect(@promise).toBeResolvedWith 'resolved by save'
          
      _and "update wouldn't make a change", ->
        beforeEach ->
          @promise = @store.update 'couch', '123', (obj) -> style: 'baws'
          
        it "should save the object", ->
          expect(@store.save).wasNotCalled()

        it "should return a resolved promise", ->
          expect(@promise).toBeResolvedWith {style: 'baws'}
  # /#update(type, id, update, options)

  describe "#updateAll(objects)", ->
    beforeEach ->
      spyOn(@hoodie, "isPromise").andReturn false
      @todoObjects = [
        {$type: 'todo', id: '1'}
        {$type: 'todo', id: '2'}
        {$type: 'todo', id: '3'}
      ]
    
    it "should return a promise", ->
      expect(@store.updateAll(@todoObjects, {})).toBePromise()
    
    it "should update objects", ->
      spyOn(@store, "update")
      @store.updateAll @todoObjects, {funky: 'update'}
      for obj in @todoObjects
        expect(@store.update).wasCalledWith obj.$type, obj.id, {funky: 'update'}, {}
    
    it "should resolve the returned promise once all objects have been updated", ->
      promise = @hoodie.defer().resolve().promise()
      spyOn(@store, "update").andReturn promise
      expect(@store.updateAll(@todoObjects, {})).toBeResolved()
    
    it "should not resolve the retunred promise unless object updates have been finished", ->
      promise = @hoodie.defer().promise()
      spyOn(@store, "update").andReturn promise
      expect(@store.updateAll(@todoObjects, {})).notToBeResolved()
    
     
    _when "passed objects is a promise", ->
      beforeEach ->
        @hoodie.isPromise.andReturn true
        
      it "should update objects returned by promise", ->
        promise = @hoodie.defer().resolve(@todoObjects).promise()
        spyOn(@store, "update")
        @store.updateAll promise, {funky: 'update'}
        for obj in @todoObjects
          expect(@store.update).wasCalledWith obj.$type, obj.id, {funky: 'update'}, {}

    _when "passed objects is a type (string)", ->
      beforeEach ->
        findAll_promise = jasmine.createSpy "findAll_promise"
        spyOn(@store, "findAll").andReturn pipe: findAll_promise
      
      it "should update objects return by findAll(type)", ->
        @store.updateAll "car", {funky: 'update'}
        expect(@store.findAll).wasCalledWith "car"

    _when "no objects passed", ->
      beforeEach ->
        findAll_promise = jasmine.createSpy "findAll_promise"
        spyOn(@store, "findAll").andReturn pipe: findAll_promise
      
      it "should update all objects", ->
        @store.updateAll null, {funky: 'update'}
        expect(@store.findAll).wasCalled()
        expect(@store.findAll.mostRecentCall.args.length).toBe 0
  # /#updateAll(objects)

  describe "#find(type, id)", ->
    it "should return a defer", ->
      defer = @store.find 'document', '123'
      expect(defer).toBeDefer()

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should be rejected", ->
          promise = @store.find()
          expect(promise).toBeRejected()

      _when "no id passed", ->
        it "should be rejected", ->
          promise = @store.find 'document'
          expect(promise).toBeRejected()

    describe "aliases", ->
      beforeEach ->
        spyOn(@store, "find")
      
      it "should allow to use .find", ->
        @store.find 'test', '123'
        expect(@store.find).wasCalledWith 'test', '123'
  # /#find(type, id)

  describe "#findAll(type)", ->
    it "should return a defer", ->
      expect(@store.findAll()).toBeDefer()

    describe "aliases", ->
      beforeEach ->
        spyOn(@store, "findAll")
      
      it "should allow to use .loadAll", ->
        @store.loadAll 'test'
        expect(@store.findAll).wasCalledWith 'test'
  # /#findAll(type)

  describe "#findOrCreate(type, id, attributes)", ->
    _when "object exists", ->
      beforeEach ->
        promise = @hoodie.defer().resolve('existing_object').promise()
        spyOn(@store, "find").andReturn promise

      it "should resolve with existing object", ->
        promise = @store.findOrCreate 'type', '123', attribute: 'value'
        expect(promise).toBeResolvedWith 'existing_object'

    _when "object does not exist", ->
      beforeEach ->
        spyOn(@store, "find").andReturn @hoodie.defer().reject().promise()
      
      it "should call `.create` with passed attributes", ->
        spyOn(@store, "create").andReturn @hoodie.defer().promise()
        promise = @store.findOrCreate 'type', 'id123', attribute: 'value'
        expect(@store.create).wasCalledWith 'type', id: 'id123', attribute: 'value'

      it "should reject when `.create` was rejected", ->
        spyOn(@store, "create").andReturn @hoodie.defer().reject().promise()
        promise = @store.findOrCreate id: '123', attribute: 'value'
        expect(promise).toBeRejected()

      it "should resolve when `.create` was resolved", ->
        promise = @hoodie.defer().resolve('new_object').promise()
        spyOn(@store, "create").andReturn promise
        promise = @store.findOrCreate id: '123', attribute: 'value'
        expect(promise).toBeResolvedWith 'new_object'
  # /#findOrCreate(attributes)

  describe "#destroy(type, id)", ->
    it "should return a defer", ->
      defer = @store.destroy 'document', '123'
      expect(defer).toBeDefer()

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should be rejected", ->
          promise = @store.destroy()
          expect(promise).toBeRejected()

      _when "no id passed", ->
        it "should be rejected", ->
          promise = @store.destroy 'document'
          expect(promise).toBeRejected()

    describe "aliases", ->
      beforeEach ->
        spyOn(@store, "destroy")
      
      it "should allow to use .destroy", ->
        @store.destroy "test", 12, {option: "value"}
        expect(@store.destroy).wasCalledWith "test", 12, {option: "value"}
    # /aliases
  # /#destroy(type, id)

  describe "#destroyAll(type)", ->
    it "should return a promise", ->
      expect(@store.destroyAll()).toBePromise()
  
    describe "aliases", ->
      it "should allow to use .destroyAll", ->
        expect(@store.destroyAll).toBe @store.destroyAll
  # /#destroyAll(type)

  describe "#uuid(num = 7)", ->
    it "should default to a length of 7", ->
      expect(@store.uuid().length).toBe 7
    
    _when "called with num = 5", ->
      it "should generate an id with length = 5", ->
        expect(@store.uuid(5).length).toBe 5
  # /#uuid(num)
# /Hoodie.Store
###