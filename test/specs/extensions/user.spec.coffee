describe "Hoodie.User", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 

  describe "constructor", ->
    beforeEach ->
      spyOn(@hoodie, "open").andReturn 'storeApi'
    
    it "should return a shortcut for hoodie.open", ->
      user = new Hoodie.User @hoodie
      expect(user('uuid123')).toBe 'storeApi'
      expect(@hoodie.open).wasCalledWith 'user/uuid123/public', prefix: '$public'

    it "should pass options", ->
      user = new Hoodie.User @hoodie
      user 'uuid123', sync: true
      expect(@hoodie.open).wasCalledWith 'user/uuid123/public', prefix: '$public', sync: true

    it "should extend hoodie.store API with publish / unpublish methods", ->
      spyOn(@hoodie.store, "decoratePromises")
      new Hoodie.User @hoodie
      expect(@hoodie.store.decoratePromises).wasCalled()
      {publish, unpublish} = @hoodie.store.decoratePromises.mostRecentCall.args[0]
      expect(typeof publish).toBe 'function'
      expect(typeof unpublish).toBe 'function'
  # /constructor

  describe "hoodie.store promise decorations", ->
    beforeEach ->
      @storeDefer = @hoodie.defer()
      spyOn(@hoodie.store, "update")
    
    describe "#publish(properties)", ->
      _when "promise returns one object", ->
        beforeEach ->
           @promise = @storeDefer.resolve({type: 'task', id: '123', title: 'milk'})
           @promise.hoodie = @hoodie
          
        _and "no properties passed", ->
          it "should update object returned by promise with $public: true", ->
            Hoodie.User::_storePublish.apply(@promise, [])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$public: true}

        _and "properties passed as array", ->
          it "should update object returned by promise with $public: ['title', 'owner']", ->
            properties = ['title', 'owner']
            Hoodie.User::_storePublish.apply(@promise, [properties])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$public: ['title', 'owner']}

      _when "promise returns multiple objects", ->
        beforeEach ->
          @promise = @storeDefer.resolve [
            {type: 'task', id: '123', title: 'milk'}
            {type: 'task', id: '456', title: 'milk'}
          ]
          @promise.hoodie = @hoodie

        _and "no properties passed", ->
          it "should update object returned by promise with $public: true", ->
            Hoodie.User::_storePublish.apply(@promise, [])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$public: true}
            expect(@hoodie.store.update).wasCalledWith 'task', '456', {$public: true}

        _and "properties passed as array", ->
          it "should update object returned by promise with $public: ['title', 'owner']", ->
            properties = ['title', 'owner']
            Hoodie.User::_storePublish.apply(@promise, [properties])
            expect(@hoodie.store.update).wasCalledWith 'task', '123', {$public: ['title', 'owner']}
            expect(@hoodie.store.update).wasCalledWith 'task', '456', {$public: ['title', 'owner']}
    # /publish()

    describe "#unpublish()", ->
      _when "promise returns one object that is public", ->
        beforeEach ->
          @promise = @storeDefer.resolve
            type: 'task'
            id: '123'
            title: 'milk'
            $public: true
          @promise.hoodie = @hoodie

        it "should update object returned by promise with $public: false", ->
          Hoodie.User::_storeUnpublish.apply(@promise, [])
          expect(@hoodie.store.update).wasCalledWith 'task', '123', {$public: false}

      _when "promise returns one object that is not public", ->
        beforeEach ->
          @promise = @storeDefer.resolve
            type: 'task'
            id: '123'
            title: 'milk'
          @promise.hoodie = @hoodie

        it "should not update object returned by promise", ->
          Hoodie.User::_storeUnpublish.apply(@promise, [])
          expect(@hoodie.store.update).wasNotCalled()

      _when "promise returns multiple objects, of which some are public", ->
        beforeEach ->
          @promise = @storeDefer.resolve [
            {type: 'task', id: '123', title: 'milk'}
            {type: 'task', id: '456', title: 'milk', $public: true}
            {type: 'task', id: '789', title: 'milk', $public: ['title', 'owner']}
          ]
          @promise.hoodie = @hoodie

        it "should update object returned by promise with $public: true", ->
          Hoodie.User::_storeUnpublish.apply(@promise, [])
          expect(@hoodie.store.update).wasNotCalledWith 'task', '123', {$public: false}
          expect(@hoodie.store.update).wasCalledWith 'task', '456', {$public: false}
          expect(@hoodie.store.update).wasCalledWith 'task', '789', {$public: false}
    # # /#unpublish()
  # /hoodie.store promise decorations