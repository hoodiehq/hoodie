describe "Hoodie.LocalStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @store  = new Hoodie.LocalStore @hoodie
    
    spyOn(@store, "_setObject").andCallThrough()
    spyOn(@store, "_getObject").andCallThrough()
    
    spyOn(@store.db, "getItem").andCallThrough()
    spyOn(@store.db, "setItem").andCallThrough()
    spyOn(@store.db, "removeItem").andCallThrough()
    spyOn(@store.db, "clear").andCallThrough()
  

  describe "constructor", ->
    it "should subscribe to account:signout event", ->
      spyOn(@hoodie, "on")
      store = new Hoodie.LocalStore @hoodie
      expect(@hoodie.on).wasCalledWith 'account:signout', store.clear

    it "should subscribe to account:signup event", ->
      spyOn(@hoodie, "on")
      store = new Hoodie.LocalStore @hoodie
      expect(@hoodie.on).wasCalledWith 'account:signup', store.markAllAsChanged

    it "should trigger idle event if there are dirty objects in localStorage", ->
      Hoodie.LocalStore::db.getItem.andCallFake (key) ->
        return 'task/1' if key is '_dirty'

      spyOn(Hoodie.LocalStore::, "_getObject").andReturn {type: 'task', id: '1', title: 'remember the milk'}
      spyOn(Hoodie.LocalStore::, "_isDirty").andReturn true
      spyOn(Hoodie.LocalStore::, "trigger")
      # make timeout immediate
      spyOn(window, "setTimeout").andCallFake (cb) -> cb()

      store = new Hoodie.LocalStore @hoodie
      expect(store.trigger).wasCalledWith 'idle'
  # /constructor
  

  describe "#save(type, id, object, options)", ->
    beforeEach ->
      spyOn(@store, "_now" ).andReturn 'now'
    
    it "should return a promise", ->
      promise = @store.save 'document', '123', name: 'test'
      expect(promise).toBePromise()

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should be rejected", ->
          expect(@store.save()).toBeRejected()
  
      _when "no object passed", ->
        it "should be rejected", ->
          promise = @store.save 'document', 'abc4567'
          expect(promise).toBeRejected()
  
    _when "id is '123', type is 'document', object is {name: 'test'}", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn 'cachedObject'
        @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }

      it "should cache document", ->
        expect(@store.cache).wasCalled()
    
      it "should add timestamps", ->
        object = @store.cache.mostRecentCall.args[2]
        expect(object.createdAt).toBe 'now'
        expect(object.updatedAt).toBe 'now'
        
      it "should pass options", ->
        options = @store.cache.mostRecentCall.args[3]
        expect(options.option).toBe 'value'
      
      _and "options.remote is true", ->
        beforeEach ->
          spyOn(@store, "trigger")
          @store.cache.andCallFake (type, id, object) ->
            if object
              { id: '123', type: 'document', name: 'test', _local: 'something', _rev: '2-345' }
            else
              { id: '123', type: 'document', name: 'test', _local: 'something', old_attribute: 'what ever', _rev: '1-234' }

          @store.save 'document', '123', { name: 'test', _rev: '2-345' }, { remote: true }
        
        it "should not touch createdAt / updatedAt timestamps", ->
          object = @store.cache.mostRecentCall.args[2]
          expect(object.createdAt).toBeUndefined()
          expect(object.updatedAt).toBeUndefined()
          
        it "should add a _syncedAt timestamp", ->
          object = @store.cache.mostRecentCall.args[2]
          expect(object._syncedAt).toBe 'now'

        it "should trigger update & change events", ->
          object  = id: '123', type: 'document', name: 'test', _local: 'something', _rev: '2-345'
          options = remote: true
          expect(@store.trigger).wasCalledWith 'update',                    object, options
          expect(@store.trigger).wasCalledWith 'update:document',           object, options
          expect(@store.trigger).wasCalledWith 'change',          'update', object, options
          expect(@store.trigger).wasCalledWith 'change:document', 'update', object, options

        it "should keep local attributes", ->
          object = @store.cache.mostRecentCall.args[2]
          expect(object._local).toBe 'something'

        it "should update _rev", ->
          object = @store.cache.mostRecentCall.args[2]
          expect(object._rev).toBe '2-345'
      
      _and "options.silent is true", ->
        beforeEach ->
          @store.save 'document', '123', { name: 'test' }, { silent: true }
        
        it "should not touch createdAt / updatedAt timestamps", ->
          object = @store.cache.mostRecentCall.args[2]
          expect(object.createdAt).toBeUndefined()
          expect(object.updatedAt).toBeUndefined()

      _and "object is new (not cached yet)", ->
        beforeEach ->
          spyOn(@store, "trigger")
          @store.cache.andCallFake (type, id, object) ->
            if object
              { id: '123', type: 'document', name: 'test', _rev: '1-345' }
            else
              undefined

          @store.save 'document', '123', { name: 'test' }

        it "should trigger add & change events", ->
          object  = id: '123', type: 'document', name: 'test', _rev: '1-345'
          expect(@store.trigger).wasCalledWith 'add',                    object, {}
          expect(@store.trigger).wasCalledWith 'add:document',           object, {}
          expect(@store.trigger).wasCalledWith 'change',          'add', object, {}
          expect(@store.trigger).wasCalledWith 'change:document', 'add', object, {}
    
      _when "successful", ->
        beforeEach ->
          @store.cache.andReturn 'doc'
        
        it "should resolve the promise", ->
          expect(@promise).toBeResolved()
    
        it "should pass the object to done callback", ->
          expect(@promise).toBeResolvedWith 'cachedObject', true
          
        _and "object did exist before", ->
          beforeEach ->
            @store.cache.andCallFake (type, id, object) ->
              if object
                'doc'
              else
                {}

            @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }
            
          it "should pass false (= not created) as the second param to the done callback", ->
            expect(@promise).toBeResolvedWith 'doc', false

        _and "object did not exist before", ->            
          beforeEach ->
            @store.cache.andCallFake (type, id, object) ->
              if object
                'doc'
              else
                undefined

            @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }
          
          it "should pass true (= new created) as the second param to the done callback", ->
            expect(@promise).toBeResolvedWith 'doc', true

          it "should set the createdBy attribute", ->
            object = @store.cache.mostRecentCall.args[2]
            expect(object.createdBy).toBe 'owner_hash'
    
      _when "failed", ->
        beforeEach ->
          @store.cache.andCallFake (type, id, object, options) -> 
            throw new Error "i/o error" if object
    
        it "should return a rejected promise", ->
          promise = @store.save 'document', '123', { name: 'test' }
          expect(promise).toBeRejected()
          
    
    _when "id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", ->
      beforeEach ->
        # keep promise, key, and stored object for assertions
        @store.save 'document', '123', {id: '123', type: 'document', name: 'test'}
        [type, key, @object] = @store.cache.mostRecentCall.args
    
    _when "id is '123', type is '$internal', object is {action: 'do some background magic'}}", ->
      beforeEach ->
        # keep promise, key, and stored object for assertions
        @promise = @store.save '$internal', '123', {action: 'do some background magic'}
  
      it "should work", ->
        expect(@promise).toBeResolved()
      
    _when "id is '123', type is 'document', object is {name: 'test', $hidden: 'fresh'}}", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn 'cachedObject'
        @store.cache.andReturn {name: 'test', $hidden: 'fresh'}
      
      it "should not overwrite $hidden property when not passed", ->
        @store.save 'document', '123', {name: 'new test'}
        [type, key, @object] = @store.cache.mostRecentCall.args 
        expect(@object.$hidden).toBe 'fresh'

      it "should overwrite $hidden property when passed", ->
        @store.save 'document', '123', {name: 'new test', $hidden: 'wicked'}
        [type, key, @object] = @store.cache.mostRecentCall.args 
        expect(@object.$hidden).toBe 'wicked'

    it "should not overwrite createdAt attribute", ->
      spyOn(@store, "cache").andReturn 'cachedObject'
      @store.save 'document', '123', { createdAt: 'check12'  }
      [type, id, object] = @store.cache.mostRecentCall.args
      expect(object.createdAt).toBe 'check12'
  
    it "should allow numbers and lowercase letters for type only. And must start with a letter or $", ->
      invalid = ['UPPERCASE', 'underLines', '-?&$', '12345', 'a']
      valid   = ['car', '$email']
      
      for key in invalid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeRejected()
       
      for key in valid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeResolved()
    
    it "should allow numbers, lowercase letters and dashes for for id only", ->
      invalid = ['UPPERCASE', 'underLines', '-?&$']
      valid   = ['abc4567', '1', 123, 'abc-567']
  
      for key in invalid
        promise = @store.save 'valid', key, {}
        expect(promise).toBeRejected()
      
      for key in valid
        promise = @store.save 'valid', key, {}
        expect(promise).toBeResolved()
        
    _when "called without id", ->
      beforeEach ->
        # keep promise, key, and stored object for assertions
        spyOn(@store, "cache").andReturn 'cachedObject'
        @promise = @store.save 'document', undefined, { name: 'test' }, { option: 'value' }
        [@type, @key, @object] = @store.cache.mostRecentCall.args
  
      it "should generate an id", ->
        expect(@key).toBe 'uuid'

      it "should set createdBy", ->
        expect(@object.createdBy).toBe 'owner_hash'
        
      it "should pass options", ->
        options = @store.cache.mostRecentCall.args[3]
        expect(options.option).toBe 'value'
        
      _when "successful", ->
    
        it "should resolve the promise", ->
          expect(@promise).toBeResolved()
    
        it "should pass the object to done callback", ->
          expect(@promise).toBeResolvedWith 'cachedObject', true
          
        it "should pass true (= created) as the second param to the done callback", ->
          expect(@promise).toBeResolvedWith 'cachedObject', true
  # /.save(type, id, object, options)
  

  describe "#add(type, object, options)", ->
    beforeEach ->
      spyOn(@store, "save").andReturn 'promise'
    
    it "should call .save(type, undefined, options) and return its promise", ->
      promise = @store.add('couch', {funky: 'fresh'})
      expect(@store.save).wasCalledWith 'couch', undefined, {funky: 'fresh'}
      expect(promise).toBe 'promise'
  # /.add(type, object, options)
  

  describe "#updateAll(objects)", ->
    beforeEach ->
      spyOn(@hoodie, "isPromise").andReturn false
      @todoObjects = [
        {type: 'todo', id: '1'}
        {type: 'todo', id: '2'}
        {type: 'todo', id: '3'}
      ]
    
    it "should return a promise", ->
      expect(@store.updateAll(@todoObjects, {})).toBePromise()
    
    it "should update objects", ->
      spyOn(@store, "update")
      @store.updateAll @todoObjects, {funky: 'update'}
      for obj in @todoObjects
        expect(@store.update).wasCalledWith obj.type, obj.id, {funky: 'update'}, {}
    
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
        promise = pipe : (cb) => cb(@todoObjects)
        spyOn(@store, "update")
        @store.updateAll promise, {funky: 'update'}
        for obj in @todoObjects
          expect(@store.update).wasCalledWith obj.type, obj.id, {funky: 'update'}, {}
  # /.updateAll(objects)


  describe "#find(type, id)", ->
    beforeEach ->
      spyOn(@store, "cache").andCallThrough()
    
    it "should return a promise", ->
      @promise = @store.find 'document', '123'

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should call the fail callback", ->
          promise = @store.find()
          expect(promise).toBeRejected()

      _when "no id passed", ->
        it "should call the fail callback", ->
          promise = @store.find 'document'
          expect(promise).toBeRejected()
      
    _when "object can be found", ->
      beforeEach ->
        @store.cache.andReturn name: 'test'
        @promise = @store.find 'document', 'abc4567'
  
      it "should call the done callback", ->
        expect(@promise).toBeResolved()
    
    _when "object cannot be found", ->
      beforeEach ->
        @store.cache.andReturn false
        @promise = @store.find 'document', 'abc4567'
    
      it "should call the fail callback", ->
        expect(@promise).toBeRejected()

    it "should cache the object after the first get", ->
      @store.find 'document', 'abc4567'
      @store.find 'document', 'abc4567'

      expect(@store.db.getItem.callCount).toBe 1
  # /.find(type, id)


  describe "#findAll(filter)", ->
    with_2CatsAnd_3Dogs = (specs) ->
      _and "two cat and three dog objects exist in the store", ->
        beforeEach ->
          spyOn(@store, "_index").andReturn ["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]
          spyOn(@store, "cache").andCallFake (type, id) -> name: "#{type}#{id}", age: parseInt(id)
        specs()

    it "should return a promise", ->
      promise = @store.findAll()
      expect(promise).toBePromise()
  
    _when "called without a type", ->
      with_2CatsAnd_3Dogs ->
        it "should return'em all", ->
          success = jasmine.createSpy 'success'
          promise = @store.findAll()
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 5
      
      _and "no documents exist in the store", ->          
        beforeEach ->
          spyOn(@store, "_index").andReturn []
    
        it "should return an empty array", ->
          promise = @store.findAll()
          expect(promise).toBeResolvedWith []
  
      _and "there are other documents in localStorage not stored with store", ->
        beforeEach ->
          spyOn(@store, "_index").andReturn ["_someConfig", "someOtherShizzle", "whatever", "valid/123"]
          spyOn(@store, "cache").andReturn {}
    
        it "should not return them", ->
          success = jasmine.createSpy 'success'
          promise = @store.findAll()
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 1
          
    _when "called only with filter `function(obj) { return obj.age === 1}` ", ->
      with_2CatsAnd_3Dogs ->
        it "should return one dog", ->
          success = jasmine.createSpy 'success'
          promise = @store.findAll (obj) -> obj.age is 1
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 2   
  # /.findAll(type)


  describe "#remove(type, id)", ->
    _when "objecet cannot be found", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn false
        
      it "should return a rejected the promise", ->
        promise = @store.remove 'document', '123'
        expect(promise).toBeRejected()
        
    _when "object can be found and has not been synched before", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {funky: 'fresh'}
        
      it "should remove the object", ->
        @store.remove 'document', '123'
        expect(@store.db.removeItem).wasCalledWith 'document/123'
        
      it "should set the _cached object to false", ->
        delete @store._cached['document/123']
        @store.remove 'document', '123'
        expect(@store._cached['document/123']).toBe false
        
      it "should clear document from changed", ->
        spyOn(@store, "clearChanged")
        @store.remove 'document', '123'
        expect(@store.clearChanged).wasCalledWith 'document', '123'
      
      it "should return a resolved promise", ->
        promise = @store.remove 'document', '123'
        expect(promise).toBeResolved()
      
      it "should return a clone of the cached object (before it was deleted)", ->
        promise = @store.remove 'document', '123', remote: true
        expect(promise).toBeResolvedWith funky: 'fresh'
    
    _when "object can be found and remove comes from remote", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn { id: '123', type: 'document', name: 'test'}
        spyOn(@store, "trigger")
        @store.remove 'document', '123', remote: true
      
      it "should remove the object", ->
        expect(@store.db.removeItem).wasCalledWith 'document/123'

      it "should trigger remove & change trigger events", ->
        expect(@store.trigger).wasCalledWith 'remove',                         { id: '123', type: 'document', name: 'test'}, { remote: true }
        expect(@store.trigger).wasCalledWith 'remove:document',                { id: '123', type: 'document', name: 'test'}, { remote: true }
        expect(@store.trigger).wasCalledWith 'remove:document:123',            { id: '123', type: 'document', name: 'test'}, { remote: true }
        expect(@store.trigger).wasCalledWith 'change',               'remove', { id: '123', type: 'document', name: 'test'}, { remote: true }
        expect(@store.trigger).wasCalledWith 'change:document',      'remove', { id: '123', type: 'document', name: 'test'}, { remote: true } 
        expect(@store.trigger).wasCalledWith 'change:document:123',  'remove', { id: '123', type: 'document', name: 'test'}, { remote: true } 
        
    _when "object can be found and was synched before", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {_syncedAt: 'now'}
        @store.remove 'document', '123'
        
      it "should mark the object as deleted and cache it", ->
        expect(@store.cache).wasCalledWith 'document', '123', {_syncedAt: 'now', _deleted: true}
        
      it "should not remove the object from store", ->
        expect(@store.db.removeItem).wasNotCalled()
  # /.remove(type, id)


  describe "#cache(type, id, object)", ->
    beforeEach ->
      spyOn(@store, "markAsChanged")
      spyOn(@store, "clearChanged")
      spyOn(@store, "_isDirty")
      spyOn(@store, "_isMarkedAsDeleted")
      @store._cached = {}
      
    _when "object passed", ->
      it "should write the object to localStorage, but without type & id attributes", ->
        @store.cache('couch', '123', color: 'red')
        expect(@store.db.setItem).wasCalledWith 'couch/123', '{"color":"red"}'

      it "should make a deep copy of passed object", ->
        originalObject =
          nested:
            property: 'funky'

        @store.cache 'couch', '123', originalObject
        newObject = @store.cache('couch', '123')
        newObject.nested.property = 'fresh'
        expect(originalObject.nested.property).toBe 'funky'
      
      _and "`options.remote = true` passed", ->
        it "should clear changed object", ->
          @store.cache 'couch', '123', {color: 'red'}, remote: true
          expect(@store.clearChanged).wasCalledWith 'couch', '123'

        it "should make a deep copy of passed object", ->
          originalObject =
            nested:
              property: 'funky'

          newObject = @store.cache 'couch', '123', originalObject, remote: true
          newObject.nested.property = 'fresh'
          expect(originalObject.nested.property).toBe 'funky'

      _and "object is marked as deleted", ->
        it "should set cache to false store object in _dirty hash", ->
          @store._isMarkedAsDeleted.andReturn true
          @store._cached = {} 
          @store._dirty  = {} 
          @store._cached['couch/123'] = {color: 'red'}
          @store.cache 'couch', '123', {color: 'red', _deleted: true}
          expect(@store._cached['couch/123']).toBe false
        
    _when "no object passed", ->
      _and "object is already cached", ->
        beforeEach ->
          @store._cached['couch/123'] = color: 'red'
        
        it "should not find it from localStorage", ->
          @store.cache 'couch', '123'
          expect(@store.db.getItem).wasNotCalled()
          
      _and "object is not yet cached", ->
        beforeEach ->
          delete @store._cached['couch/123']
        
        _and "object does exist in localStorage", ->
          beforeEach ->
            @object = 
              type: 'couch'
              id: '123'
              color: 'red'
            @store._getObject.andReturn @object
          
          it "should cache it for future", ->
            @store.cache 'couch', '123'
            expect(@store._cached['couch/123'].color).toBe 'red'

          it "should make a deep copy", ->
            originalObject =
              nested:
                property: 'funky'
            @store._getObject.andReturn originalObject
            obj1 = @store.cache 'couch', '123'
            obj1.nested.property = 'fresh'
            obj2 = @store.cache 'couch', '123'
            expect(obj2.nested.property).toBe 'funky'

          _and "object is dirty", ->
            beforeEach -> 
              @store._isDirty.andReturn true
            
            it "should mark it as changed", ->
              @store.cache 'couch', '123'
              expect(@store.markAsChanged).wasCalledWith 'couch', '123', @object, {}
          
          _and "object is not dirty", ->
            beforeEach -> @store._isDirty.andReturn false
            
            _and "not marked as deleted", ->
              beforeEach -> @store._isMarkedAsDeleted.andReturn false
              
              it "should clean it", ->
                @store.cache 'couch', '123'
                expect(@store.clearChanged).wasCalledWith 'couch', '123'
                
            _but "marked as deleted", ->
              beforeEach -> @store._isMarkedAsDeleted.andReturn true
            
              it "should mark it as changed", ->
                @store.cache 'couch', '123'
                object  = { color: 'red', type: 'couch', id: '123' }
                options = {}
                expect(@store.markAsChanged).wasCalledWith 'couch', '123', object, options
          
        _and "object does not exist in localStorage", ->
          beforeEach ->
            @store._getObject.andReturn false
          
          it "should cache it for future", ->
            @store.cache 'couch', '123'
            expect(@store._cached['couch/123']).toBe false
            
          it "should return false", ->
            expect(@store.cache 'couch', '123').toBe false
    
    it "should return the object including type & id attributes", ->
      obj = @store.cache 'couch', '123', color: 'red'
      expect(obj.color).toBe 'red'
      expect(obj.type).toBe 'couch'
      expect(obj.id).toBe    '123'
  # /.cache(type, id, object)


  describe "#clear()", ->
    
    it "should return a promise", ->
      promise = @store.clear()
      expect(promise).toBePromise()
      
    it "should clear localStorage", ->
      spyOn(@store, "_index").andReturn ['$config/hoodie', 'car/123', '_notOurBusiness']
      @store.clear()
      expect(@store.db.removeItem).wasCalledWith '$config/hoodie'
      expect(@store.db.removeItem).wasCalledWith 'car/123'
      expect(@store.db.removeItem).wasNotCalledWith '_notOurBusiness'
    
    it "should clear chache", ->
      @store._cached = 'funky'
      @store.clear()      
      expect($.isEmptyObject @store._cached).toBeTruthy()

    it "should clear dirty docs", ->
      spyOn(@store, "clearChanged")
      @store.clear()      
      expect(@store.clearChanged).wasCalled()
      
    it "should resolve promise", ->
      promise = @store.clear()
      expect(promise).toBeResolved()
    
    _when "an error occurs", ->
      beforeEach ->
        spyOn(@store, "clearChanged").andCallFake -> throw new Error('ooops')
      
      it "should reject the promise", ->
        promise = @store.clear()      
        expect(promise).toBeRejected()
  # /.clear()

  describe "#isDirty(type, id)", ->
    _when "no arguments passed", ->
      it "returns true when there are no dirty documents", ->
        @store._dirty ={}
        expect(@store.isDirty()).toBeTruthy()
        
    _when "type & id passed", ->
      _and "object was not yet synced", ->
        _and "object has saved with silent:true option", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn _syncedAt: undefined, updatedAt: undefined
                
          it "should return false", ->
            expect(@store.isDirty 'couch', '123').toBe false

        _and "object has been saved without silent:true option", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn _syncedAt: undefined, updatedAt: new Date(0)
                
          it "should return true", ->
            expect(@store.isDirty 'couch', '123').toBe true
      
      _and "object was synced", ->
        _and "object was not updated yet", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _syncedAt : new Date(0)
              updatedAt: undefined
          
          it "should return false", ->
            do expect(@store.isDirty 'couch', '123').toBeFalsy
            
        _and "object was updated at the same time", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _syncedAt : new Date(0)
              updatedAt: new Date(0)
              
          it "should return false", ->
            do expect(@store.isDirty 'couch', '123').toBeFalsy
            
        _and "object was updated later", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _syncedAt : new Date(0)
              updatedAt: new Date(1)
              
          it "should return true", ->
            do expect(@store.isDirty 'couch', '123').toBeTruthy
  # /.isDirty(type, id)
  

  describe "#markAsChanged(type, id, object)", ->
    beforeEach ->
      @store._dirty = {}
      
      spyOn(window, "setTimeout").andReturn 'newTimeout'
      spyOn(window, "clearTimeout")
      spyOn(@store, "trigger")
      @store.markAsChanged 'couch', '123', color: 'red'
    
    it "should add it to the dirty list", ->
      expect(@store._dirty['couch/123'].color).toBe 'red'
      
    it "should start dirty timeout for 2 seconds", ->
      args = window.setTimeout.mostRecentCall.args
      expect(args[1]).toBe 2000
      expect(@store._dirtyTimeout).toBe 'newTimeout'
      
    it "should clear dirty timeout", ->
      @store._dirtyTimeout = 'timeout'
      @store.markAsChanged 'couch', '123', color: 'red'
      expect(window.clearTimeout).wasCalledWith 'timeout'

    it "should trigger 'dirty' event", ->
       expect(@store.trigger).wasCalledWith 'dirty'
  # /.markAsChanged(type, id, object)
  

  describe "#markAllAsChanged(type, id, object)", ->
    beforeEach ->
      @findAllDefer = @hoodie.defer()
      spyOn(@store, "markAsChanged").andCallThrough()
      spyOn(@store, "findAll").andReturn @findAllDefer.promise()

    it "should find all local objects", ->
      @store.markAllAsChanged()
      expect(@store.findAll).wasCalled()

    _when "findAll fails", ->
      beforeEach ->
        @findAllDefer.reject reason: 'because'
      
      it "should return its rejected promise", ->
         promise = @store.markAllAsChanged()
         expect(promise).toBeRejectedWith reason: 'because'

    _when "findAll succeeds", ->
      beforeEach ->
        @store._dirty = {}
        @objects = [
          { id: '1', type: 'document', name: 'test1'}
          { id: '2', type: 'document', name: 'test2'}
          { id: '3', type: 'document', name: 'test3'}
        ]
        @findAllDefer.resolve @objects
        spyOn(window, "setTimeout").andReturn 'newTimeout'
        spyOn(window, "clearTimeout")
        spyOn(@store, "trigger")
        @store._dirtyTimeout = 'timeout'
        @store.markAllAsChanged()
      
      it "should add returned obejcts to the dirty list", ->
        expect(@store._dirty['document/1'].name).toBe 'test1'
        expect(@store._dirty['document/2'].name).toBe 'test2'
        expect(@store._dirty['document/3'].name).toBe 'test3'
        
      it "should start dirty timeout for 2 seconds", ->
        args = window.setTimeout.mostRecentCall.args
        expect(args[1]).toBe 2000
        expect(@store._dirtyTimeout).toBe 'newTimeout'
        expect(window.setTimeout.callCount).toBe 1
        
      it "should clear dirty timeout", ->
        expect(window.clearTimeout).wasCalledWith 'timeout'
        expect(window.clearTimeout.callCount).toBe 1

      it "should trigger 'dirty' event", ->
        expect(@store.trigger).wasCalledWith 'dirty'
        expect(@store.trigger.callCount).toBe 1
  # /.markAllAsChanged(type, id, object)
  

  describe "#changedDocs()", ->
    _when "there are no changed docs", ->
      beforeEach ->
        @store._dirty = {}
        
      it "should return an empty array", ->
        expect($.isArray @store.changedDocs()).toBeTruthy()
        expect(@store.changedDocs().length).toBe 0
        
    _when "there are 2 dirty docs", ->
      beforeEach ->
        @store._dirty = {
          'couch/123': { color: 'red' }
          'couch/456': { color: 'green' }
        }
        
      it "should return the two docs", ->
        expect(@store.changedDocs().length).toBe 2

      it "should add type and id", ->
        [doc1, doc2] = @store.changedDocs()
        expect(doc1.type).toBe 'couch'
        expect(doc1.id).toBe '123'
  # /.changedDocs()


  describe "#isMarkedAsDeleted(type, id)", ->
    _when "object 'couch/123' is marked as deleted", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn _deleted: true
      
      it "should return true", ->
        expect(@store.isMarkedAsDeleted('couch', '123')).toBeTruthy()
        
    _when "object 'couch/123' isn't marked as deleted", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {}
        
      it "should return false", ->
        expect(@store.isMarkedAsDeleted('couch', '123')).toBeFalsy()
  # /.isMarkedAsDeleted(type, id)


  describe "#clearChanged(type, id)", ->
    it "should clear _dirtyTimeout", ->
      spyOn(window, "clearTimeout")
      @store._dirtyTimeout = 1
      @store.clearChanged 'couch', 123
      expect(window.clearTimeout).wasCalledWith 1

    _when "type & id passed", ->
      it "should remove the respective object from the dirty list", ->
        @store._dirty['couch/123'] = {color: 'red'}
        @store.clearChanged 'couch', 123
        expect(@store._dirty['couch/123']).toBeUndefined()

      it "should update array of _dirty IDs in localStorage", ->
        @store._dirty = {}
        @store._dirty['couch/123'] = {color: 'red'}
        @store._dirty['couch/456'] = {color: 'green'}
        @store._dirty['couch/789'] = {color: 'black'}
        @store.clearChanged 'couch', 123
        expect(@store.db.setItem).wasCalledWith '_dirty', 'couch/456,couch/789'
    
    _when "no arguments passed", ->
      it "should remove all objects from the dirty list", ->
        @store._dirty =
          'couch/123': color: 'red'
          'couch/456': color: 'green'
        @store.clearChanged()
        do expect($.isEmptyObject @store._dirty).toBeTruthy

      it "should remove _dirty IDs from localStorage", ->
        @store.clearChanged()
        expect(@store.db.removeItem).wasCalledWith '_dirty'         
  # /.clearChanged()


  describe "#trigger", ->
    beforeEach ->
      spyOn(@hoodie, "trigger")
    
    it "should proxy to hoodie.trigger with 'store' namespace", ->
       @store.trigger 'event', funky: 'fresh'
       expect(@hoodie.trigger).wasCalledWith 'store:event', funky: 'fresh'
  # /#trigger


  describe "#on", ->
    beforeEach ->
      spyOn(@hoodie, "on")
    
    it "should proxy to hoodie.on with 'store' namespace", ->
       @store.on 'event', funky: 'fresh'
       expect(@hoodie.on).wasCalledWith 'store:event', funky: 'fresh'

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @store.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'store:super store:funky store:fresh', cb
  # /#on


  describe "#decoratePromises", ->
    it "should decorate promises returned by the store", ->
      funk = jasmine.createSpy('funk')
      @store.decoratePromises 
        funk: funk

      promise = @store.save('task', {title: 'save the world'})
      promise.funk()
      expect(funk).wasCalled()
    
    for method in "add find findAll findOrAdd update updateAll remove removeAll".split " "
      it "should scope passed methods to returned promise by #{method}", ->
         @store.decoratePromises 
           funk: ->
              return this

          promise = @store[method]('task', '12')
          expect(promise.funk()).toBePromise()
  # /#decoratePromises
# /Hoodie.LocalStore