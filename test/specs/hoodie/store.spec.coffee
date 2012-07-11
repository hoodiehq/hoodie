describe "Hoodie.Store", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    @store = new Hoodie.Store @hoodie
    
    spyOn(@store, "_setObject").andCallThrough()
    spyOn(@store, "_getObject").andCallThrough()
    
    spyOn(@store.db, "getItem").andCallThrough()
    spyOn(@store.db, "setItem").andCallThrough()
    spyOn(@store.db, "removeItem").andCallThrough()
    spyOn(@store.db, "clear").andCallThrough()
  
  describe "new", ->
    it "should subscribe to account:signed_out event", ->
      spyOn(@hoodie, "on")
      store = new Hoodie.Store @hoodie
      expect(@hoodie.on).wasCalledWith 'account:signed_out', store.clear
  # /new
  
  describe ".save(type, id, object, options)", ->
    beforeEach ->
      spyOn(@store, "_now").andReturn 'now'
      spyOn(@store, "cache").andReturn 'cached_object'
    
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
        @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }

      it "should cache document", ->
        expect(@store.cache).wasCalled()
    
      it "should add timestamps", ->
        object = @store.cache.mostRecentCall.args[2]
        expect(object.created_at).toBe 'now'
        expect(object.updated_at).toBe 'now'
      
      _and "options.remote is true", ->
        it "should not touch created_at / updated_at timestamps", ->
          @store.save 'document', '123', { name: 'test' }, { remote: true }
          object = @store.cache.mostRecentCall.args[2]
          expect(object.created_at).toBeUndefined()
          expect(object.updated_at).toBeUndefined()
          
        it "should add a _synced_at timestamp", ->
          @store.save 'document', '123', { name: 'test' }, { remote: true }
          object = @store.cache.mostRecentCall.args[2]
          expect(object._synced_at).toBe 'now'
      
      _and "options.silent is true", ->
        it "should not touch created_at / updated_at timestamps", ->
          @store.save 'document', '123', { name: 'test' }, { silent: true }
          object = @store.cache.mostRecentCall.args[2]
          expect(object.created_at).toBeUndefined()
          expect(object.updated_at).toBeUndefined()
        
      
      it "should pass options", ->
        options = @store.cache.mostRecentCall.args[3]
        expect(options.option).toBe 'value'
    
      _when "successful", ->
        beforeEach ->
          @store.cache.andReturn 'doc'
        
    
        it "should resolve the promise", ->
          expect(@promise).toBeResolved()
    
        it "should pass the object to done callback", ->
          expect(@promise).toBeResolvedWith 'cached_object', true
          
        _and "object did exist before", ->
          beforeEach ->
            @store._cached['document/123'] = {}
            @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }
            
          it "should pass false (= not created) as the second param to the done callback", ->
            expect(@promise).toBeResolvedWith 'doc', false

          
        _and "object did not exist before", ->            
          beforeEach ->
            delete @store._cached['document/123']
            @promise = @store.save 'document', '123', { name: 'test' }, { option: 'value' }
          
          it "should pass true (= new created) as the second param to the done callback", ->
            expect(@promise).toBeResolvedWith 'doc', true
    
      _when "failed", ->
        beforeEach ->
          @store.cache.andCallFake -> throw new Error "i/o error"
    
        it "should return a rejected promise", ->
          promise = @store.save 'document', '123', { name: 'test' }
          expect(promise).toBeRejected()
          
    
    _when "id is '123', type is 'document', object is {id: '123', type: 'document', name: 'test'}", ->
      beforeEach ->
        # keep promise, key, and stored object for assertions
        @store.save 'document', '123', {id: '123', type: 'document', name: 'test'}
        [type, key, @object] = @store.cache.mostRecentCall.args
  
      it "should cache the object without the id attribute", ->
        expect(@object.id).toBeUndefined()
  
      it "should store the object without the type attribute", ->
        expect(@object.type).toBeUndefined()
    
    _when "id is '123', type is '$internal', object is {action: 'do some background magic'}}", ->
      beforeEach ->
        # keep promise, key, and stored object for assertions
        @promise = @store.save '$internal', '123', {action: 'do some background magic'}
  
      it "should work", ->
        expect(@promise).toBeResolved()
      
    
    it "should not overwrite created_at attribute", ->
      @store.save 'document', '123', { created_at: 'check12'  }
      [type, id, object] = @store.cache.mostRecentCall.args
      expect(object.created_at).toBe 'check12'
  
    it "should allow numbers and lowercase letters for for type only. And must start with a letter or $", ->
      invalid = ['UPPERCASE', 'under_lines', '-?&$', '12345', 'a']
      valid   = ['car', '$email']
      
      for key in invalid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeRejected()
       
      for key in valid
        promise = @store.save key, 'valid', {}
        expect(promise).toBeResolved()
    
    it "should allow numbers, lowercase letters and dashes for for id only", ->
      invalid = ['UPPERCASE', 'under_lines', '-?&$']
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
        @promise = @store.save 'document', undefined, { name: 'test' }, { option: 'value' }
        [@type, @key, @object] = @store.cache.mostRecentCall.args
  
      it "should generate an id", ->
        expect(@key).toMatch /^[a-z0-9]{7}$/
        
      it "should pass options", ->
        options = @store.cache.mostRecentCall.args[3]
        expect(options.option).toBe 'value'
        
      _when "successful", ->
    
        it "should resolve the promise", ->
          expect(@promise).toBeResolved()
    
        it "should pass the object to done callback", ->
          expect(@promise).toBeResolvedWith 'cached_object', true
          
        it "should pass true (= created) as the second param to the done callback", ->
          expect(@promise).toBeResolvedWith 'cached_object', true
  # /.save(type, id, object, options)
  
  describe ".create(type, object, options)", ->
    beforeEach ->
      spyOn(@store, "save").andReturn 'promise'
    
    it "should call .save(type, undefined, options) and return its promise", ->
      promise = @store.create('couch', {funky: 'fresh'})
      expect(@store.save).wasCalledWith 'couch', undefined, {funky: 'fresh'}
      expect(promise).toBe 'promise'
  # /.create(type, object, options)
  
  describe ".update(type, id, update, options)", ->
    beforeEach ->
      spyOn(@store, "load")
      spyOn(@store, "save").andReturn then: ->
    
    _when "object cannot be found", ->
      beforeEach ->
        @store.load.andReturn $.Deferred().reject()
        @promise = @store.update 'couch', '123', funky: 'fresh'
      
      it "should create it", ->
        expect(@store.save).wasCalledWith 'couch', '123', funky: 'fresh', {}
        # expect(@promise).toBeRejected()
    
    _when "object can be found", ->
      beforeEach ->
        @store.load.andReturn $.Deferred().resolve { style: 'baws' }
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
        
  # /.update(type, id, update, options)
  
  describe ".updateAll(objects)", ->
    beforeEach ->
      spyOn(@hoodie, "isPromise").andReturn false
      @todo_objects = [
        {type: 'todo', id: '1'}
        {type: 'todo', id: '2'}
        {type: 'todo', id: '3'}
      ]
    
    it "should return a promise", ->
      expect(@store.updateAll(@todo_objects, {})).toBePromise()
    
    it "should update objects", ->
      spyOn(@store, "update")
      @store.updateAll @todo_objects, {funky: 'update'}
      for obj in @todo_objects
        expect(@store.update).wasCalledWith obj.type, obj.id, {funky: 'update'}, {}
    
    it "should resolve the returned promise once all objects have been updated", ->
      promise = @hoodie.defer().resolve().promise()
      spyOn(@store, "update").andReturn promise
      expect(@store.updateAll(@todo_objects, {})).toBeResolved()
    
    it "should not resolve the retunred promise unless object updates have been finished", ->
      promise = @hoodie.defer().promise()
      spyOn(@store, "update").andReturn promise
      expect(@store.updateAll(@todo_objects, {})).notToBeResolved()
    
     
    _when "passed objects is a promise", ->
      beforeEach ->
        @hoodie.isPromise.andReturn true
        
      it "should update objects returned by promise", ->
        promise = pipe : (cb) => cb(@todo_objects)
        spyOn(@store, "update")
        @store.updateAll promise, {funky: 'update'}
        for obj in @todo_objects
          expect(@store.update).wasCalledWith obj.type, obj.id, {funky: 'update'}, {}
  # /.updateAll(objects)

  describe ".load(type, id)", ->
    beforeEach ->
      spyOn(@store, "cache").andCallThrough()
    
    it "should return a promise", ->
      @promise = @store.load 'document', '123'

    describe "invalid arguments", ->
      _when "no arguments passed", ->          
        it "should call the fail callback", ->
          promise = @store.load()
          expect(promise).toBeRejected()

      _when "no id passed", ->
        it "should call the fail callback", ->
          promise = @store.load 'document'
          expect(promise).toBeRejected()
      
    _when "object can be found", ->
      beforeEach ->
        @store.cache.andReturn name: 'test'
        @promise = @store.load 'document', 'abc4567'
  
      it "should call the done callback", ->
        expect(@promise).toBeResolved()
    
    _when "object cannot be found", ->
      beforeEach ->
        @store.cache.andReturn false
        @promise = @store.load 'document', 'abc4567'
    
      it "should call the fail callback", ->
        expect(@promise).toBeRejected()

    it "should cache the object after the first get", ->
      @store.load 'document', 'abc4567'
      @store.load 'document', 'abc4567'

      expect(@store.db.getItem.callCount).toBe 1
  # /.get(type, id)

  describe ".loadAll(filter)", ->
    with_2_cats_and_3_dogs = (specs) ->
      _and "two cat and three dog objects exist in the store", ->
        beforeEach ->
          spyOn(@store, "_index").andReturn ["cat/1", "cat/2", "dog/1", "dog/2", "dog/3"]
          spyOn(@store, "cache").andCallFake (type, id) -> name: "#{type}#{id}", age: parseInt(id)
        specs()

    it "should return a promise", ->
      promise = @store.loadAll()
      expect(promise).toBePromise()
  
    _when "called without a type", ->
      with_2_cats_and_3_dogs ->
        it "should return'em all", ->
          success = jasmine.createSpy 'success'
          promise = @store.loadAll()
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 5
      
      _and "no documents exist in the store", ->          
        beforeEach ->
          spyOn(@store, "_index").andReturn []
    
        it "should return an empty array", ->
          promise = @store.loadAll()
          expect(promise).toBeResolvedWith []
  
      _and "there are other documents in localStorage not stored with store", ->
        beforeEach ->
          spyOn(@store, "_index").andReturn ["_some_config", "some_other_shizzle", "whatever", "valid/123"]
          spyOn(@store, "cache").andReturn {}
    
        it "should not return them", ->
          success = jasmine.createSpy 'success'
          promise = @store.loadAll()
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 1
          
    _when "called only with filter `function(obj) { return obj.age === 1}` ", ->
      with_2_cats_and_3_dogs ->
        it "should return one dog", ->
          success = jasmine.createSpy 'success'
          promise = @store.loadAll (obj) -> obj.age is 1
          promise.done success
          
          results = success.mostRecentCall.args[0]
          expect(results.length).toBe 2   
  # /.loadAll(type)

  describe ".delete(type, id)", ->
    _when "objecet cannot be found", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn false
        
      it "should return a rejected the promise", ->
        promise = @store.delete 'document', '123'
        expect(promise).toBeRejected()
        
    _when "object can be found and has not been synched before", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {}
        
      it "should remove the object", ->
        @store.delete 'document', '123'
        expect(@store.db.removeItem).wasCalledWith 'document/123'
        
      it "should set the _cached object to false", ->
        delete @store._cached['document/123']
        @store.delete 'document', '123'
        expect(@store._cached['document/123']).toBe false
        
      it "should clear document from changed", ->
        spyOn(@store, "clear_changed")
        @store.delete 'document', '123'
        expect(@store.clear_changed).wasCalledWith 'document', '123'
      
      it "should return a resolved promise", ->
        promise = @store.delete 'document', '123'
        expect(promise).toBeResolved()
      
      it "should return a clone of the cached object (before it was deleted)", ->
        spyOn($, "extend")
        promise = @store.delete 'document', '123', remote: true
        expect($.extend).wasCalled()
    
    _when "object can be found and delete comes from remote", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {_synced_at: 'now'}
      
      it "should remove the object", ->
        @store.delete 'document', '123', remote: true
        expect(@store.db.removeItem).wasCalledWith 'document/123'
        
    _when "object can be found and was synched before", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {_synced_at: 'now'}
        
      it "should mark the object as deleted and cache it", ->
        promise = @store.delete 'document', '123'
        expect(@store.cache).wasCalledWith 'document', '123', {_synced_at: 'now', _deleted: true}
        
      it "should not remove the object from store", ->
        @store.delete 'document', '123'
        expect(@store.db.removeItem).wasNotCalled()
      
      
      
    
    describe "aliases", ->
      it "should allow to use .destroy", ->
        expect(@store.destroy).toBe @store.delete
    # /aliases
  # /.destroy(type, id)

  describe ".cache(type, id, object)", ->
    beforeEach ->
      spyOn(@store, "mark_as_changed")
      spyOn(@store, "clear_changed")
      spyOn(@store, "_is_dirty")
      spyOn(@store, "_is_marked_as_deleted")
      @store._cached = {}
      
    _when "object passed", ->
      it "should write the object to localStorage, but without type & id attributes", ->
        @store.cache('couch', '123', color: 'red')
        expect(@store.db.setItem).wasCalledWith 'couch/123', '{"color":"red"}'
      
      _when "`options.remote = true` passed", ->
        it "should clear changed object", ->
          @store.cache('couch', '123', {color: 'red'}, remote: true)
          expect(@store.clear_changed).wasCalledWith 'couch', '123'
    
    _when "no object passed", ->
      _and "object is already cached", ->
        beforeEach ->
          @store._cached['couch/123'] = color: 'red'
        
        it "should not load it from localStorage", ->
          @store.cache 'couch', '123'
          expect(@store.db.getItem).wasNotCalled()
          
      _and "object is not yet cached", ->
        beforeEach ->
          delete @store._cached['couch/123']
        
        _and "object does exist in localStorage", ->
          beforeEach ->
            @store._getObject.andReturn 
              color: 'red'
          
          it "should cache it for future", ->
            @store._getObject.andReturn 
              color: 'red'
            @store.cache 'couch', '123'
            expect(@store._cached['couch/123'].color).toBe 'red'
          
          
        _and "object does not exist in localStorage", ->
          beforeEach ->
            @store._getObject.andReturn false
          
          it "should cache it for future", ->
            @store.cache 'couch', '123'
            expect(@store._cached['couch/123']).toBe false
            
          it "should return false", ->
            expect(@store.cache 'couch', '123').toBe false
          
    
    _when "object is dirty", ->
      beforeEach -> @store._is_dirty.andReturn true
      
      it "should mark it as changed", ->
        @store.cache 'couch', '123'
        expect(@store.mark_as_changed).wasCalledWith 'couch', '123', color: 'red', type: 'couch', id: '123'
    
    _when "object is not dirty", ->
      beforeEach -> @store._is_dirty.andReturn false
      
      _and "not marked as deleted", ->
        beforeEach -> @store._is_marked_as_deleted.andReturn false
        
        it "should clean it", ->
          @store.cache 'couch', '123'
          expect(@store.clear_changed).wasCalledWith 'couch', '123'
          
      _but "marked as deleted", ->
        beforeEach -> @store._is_marked_as_deleted.andReturn true
      
        it "should mark it as changed", ->
          @store.cache 'couch', '123'
          expect(@store.mark_as_changed).wasCalledWith 'couch', '123', color: 'red', type: 'couch', id: '123'
    
    it "should return the object including type & id attributes", ->
      obj = @store.cache 'couch', '123', color: 'red'
      expect(obj.color).toBe  'red'
      expect(obj.type).toBe   'couch'
      expect(obj.id).toBe     '123'
    
  # /.cache(type, id, object)

  describe ".clear()", ->
    
    it "should return a promise", ->
      promise = @store.clear()
      expect(promise).toBePromise()
      
    it "should clear localStorage", ->
      @store.clear()
      do expect(@store.db.clear).wasCalled
    
    it "should clear chache", ->
      @store._cached = 'funky'
      @store.clear()      
      expect($.isEmptyObject @store._cached).toBeTruthy()

    it "should clear dirty docs", ->
      spyOn(@store, "clear_changed")
      @store.clear()      
      do expect(@store.clear_changed).wasCalled
      
    it "should resolve promise", ->
      promise = @store.clear()
      expect(promise).toBeResolved()
    
    _when "an error occurs", ->
      beforeEach ->
        spyOn(@store, "clear_changed").andCallFake -> throw new Error('ooops')
      
      it "should reject the promise", ->
        promise = @store.clear()      
        expect(promise).toBeRejected()
  # /.clear()

  describe ".is_dirty(type, id)", ->
    _when "no arguments passed", ->
      it "returns true when there are no dirty documents", ->
        @store._dirty ={}
        expect(@store.is_dirty()).toBeTruthy()
        
    _when "type & id passed", ->
      _and "object was not yet synced", ->
        beforeEach ->
          spyOn(@store, "cache").andReturn _synced_at: undefined
        
        it "should return true", ->
          do expect(@store.is_dirty 'couch', '123').toBeTruthy
      
      _and "object was synced", ->
        _and "object was not updated yet", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _synced_at : new Date(0)
              updated_at: undefined
          
          it "should return false", ->
            do expect(@store.is_dirty 'couch', '123').toBeFalsy
            
        _and "object was updated at the same time", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _synced_at : new Date(0)
              updated_at: new Date(0)
              
          it "should return false", ->
            do expect(@store.is_dirty 'couch', '123').toBeFalsy
            
        _and "object was updated later", ->
          beforeEach ->
            spyOn(@store, "cache").andReturn 
              _synced_at : new Date(0)
              updated_at: new Date(1)
              
          it "should return true", ->
            do expect(@store.is_dirty 'couch', '123').toBeTruthy
  # /.is_dirty(type, id)
  
  describe ".mark_as_changed(type, id, object)", ->
    beforeEach ->
      @store._dirty = {}
      
      spyOn(window, "setTimeout").andReturn 'new_timeout'
      spyOn(window, "clearTimeout")
      spyOn(@hoodie, "trigger")
      @store.mark_as_changed 'couch', '123', color: 'red'
    
    it "should add it to the dirty list", ->
      expect(@store._dirty['couch/123'].color).toBe 'red'
      
    it "should should trigger an `store:dirty` event", ->
      expect(@hoodie.trigger).wasCalledWith 'store:dirty'
      
    it "should start dirty timeout for 2 seconds", ->
      args = window.setTimeout.mostRecentCall.args
      expect(args[1]).toBe 2000
      expect(@store._dirty_timeout).toBe 'new_timeout'
      
    it "should clear dirty timeout", ->
      @store._dirty_timeout = 'timeout'
      @store.mark_as_changed 'couch', '123', color: 'red'
      expect(window.clearTimeout).wasCalledWith 'timeout'
  # /.mark_as_changed(type, id, object)
  
  describe ".changed_docs()", ->
    _when "there are no changed docs", ->
      beforeEach ->
        @store._dirty = {}
        
      it "should return an empty array", ->
        expect($.isArray @store.changed_docs()).toBeTruthy()
        expect(@store.changed_docs().length).toBe 0
        
    _when "there are 2 dirty docs", ->
      beforeEach ->
        @store._dirty = [
          { type: 'couch', id: '123', color: 'red'}
          { type: 'couch', id: '456', color: 'green'}
        ]
        
      it "should return the two docs", ->
        expect(@store.changed_docs().length).toBe 2
  # /.changed_docs()

  describe ".is_marked_as_deleted(type, id)", ->
    _when "object 'couch/123' is marked as deleted", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn _deleted: true
      
      it "should return true", ->
        expect(@store.is_marked_as_deleted('couch', '123')).toBeTruthy()
        
    _when "object 'couch/123' isn't marked as deleted", ->
      beforeEach ->
        spyOn(@store, "cache").andReturn {}
        
      it "should return false", ->
        expect(@store.is_marked_as_deleted('couch', '123')).toBeFalsy()
  # /.is_marked_as_deleted(type, id)

  describe ".clear_changed(type, id)", ->
    _when "type & id passed", ->
      it "should remove the respective object from the dirty list", ->
        @store._dirty['couch/123'] = {color: 'red'}
        @store.clear_changed 'couch', 123
        expect(@store._dirty['couch/123']).toBeUndefined()
    
    _when "no arguments passed", ->
      it "should remove all objects from the dirty list", ->
        @store._dirty =
          'couch/123': color: 'red'
          'couch/456': color: 'green'
        @store.clear_changed()
        do expect($.isEmptyObject @store._dirty).toBeTruthy
      
    it "should trigger a `store:dirty` event", ->
      spyOn(@hoodie, "trigger")
      @store.clear_changed()
      expect(@hoodie.trigger).wasCalledWith 'store:dirty'
  # /.clear_changed()
  
  describe ".uuid(num = 7)", ->
    it "should default to a length of 7", ->
      expect(@store.uuid().length).toBe 7
    
    _when "called with num = 5", ->
      it "should generate an id with length = 5", ->
        expect(@store.uuid(5).length).toBe 5
  # /.uuid(num)
# /Hoodie.Store