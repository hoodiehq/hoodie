describe "Hoodie.ShareInstance", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    Hoodie.ShareInstance.prototype.hoodie = @hoodie
    @share = new Hoodie.ShareInstance id: 'share1'
  
  describe "constructor", ->
    beforeEach ->
      spyOn(Hoodie.ShareInstance::, "set").andCallThrough()
      
    it "should set passed options", ->
      share = new Hoodie.ShareInstance {option1: "value1", option2: "value2"}
      expect(Hoodie.ShareInstance::set).wasCalledWith {option1: "value1", option2: "value2"}
    
    it "should set id from options.id", ->
      share = new Hoodie.ShareInstance id: 'id123'
      expect(share.id).toBe 'id123'

    it "should generate an id if options.id wasn't passed", ->
      share = new Hoodie.ShareInstance
      expect(share.id).toBe 'uuid'
       
    it "should default access to false", ->
      share = new Hoodie.ShareInstance
      expect(share.access).toBe false
  # /constructor

  describe "#set(key, value)", ->
    _when "key is a string", ->
      it "should set key as instance variable", ->
        @share.set("access", true)
        expect(@share.access).toBe true

      it "shouldn't allow to set unknown options", ->
        @share.set("unknownOption", "funky")
        expect(@share.unknownOption).toBe undefined

    _when "key is a hash", ->
      it "should set all options from passed hash", ->
        @options =
          access     : true
          password   : 'secret'
        @share.set(@options)
        for key, value of @options
          expect(@share[key]).toBe value

      it "shouldn't set unnown options", ->
        @options =
          unknown   : 1
          malicious : 2
        @share.set(@options)
        for key of @options
          expect(@share[key]).toBe undefined
  # /#set(key,value)


  describe "#get(key)", ->
    it "should return value of passed property", ->
      @share.funky = 'fresh'
      expect(@share.funky).toBe 'fresh'
  # /#get(key)


  describe "#save(update, options)", ->
    beforeEach ->
      @updatePromise = @hoodie.defer()
      spyOn(@hoodie.my.store, "update").andReturn @updatePromise.promise()
      spyOn(@share, "set").andCallThrough()
      
    
    _when "user has no account yet", ->
      beforeEach ->
        spyOn(@hoodie.my.account, "hasAccount").andReturn false
        spyOn(@hoodie.my.account, "anonymousSignUp")

      it "should sign up anonymously", ->
        @share.save()
        expect(@hoodie.my.account.anonymousSignUp).wasCalled()

    _when "user has an account", ->
      beforeEach ->
        spyOn(@hoodie.my.account, "hasAccount").andReturn true
        spyOn(@hoodie.my.account, "anonymousSignUp")

      it "should not sign up anonymously", ->
        @share.save()
        expect(@hoodie.my.account.anonymousSignUp).wasNotCalled() 

    _when "update passed", ->
      it "should set the passed properties", ->
        @share.save {funky: 'fresh'}
        expect(@share.set).wasCalledWith {funky: 'fresh'}

      it "should update $share with properties updated using #set() before", ->
        @share._memory = {}
        @share.set 'access', true
        @share.set 'password', 'secret'
        @share.save()
        expect(@hoodie.my.store.update).wasCalledWith '$share', 'share1', {
          access   : true
          password : 'secret'
        }, undefined

    it "should return a promise", ->
      expect(@share.save()).toBePromise() 

    it "should update its properties with attributes returned from store.update", ->
      @updatePromise.resolve({funky: 'fresh'})
      @share.save()
      expect(@share.funky).toBe 'fresh'
  # /#save(update, options)


  describe "#add(objects, sharedAttributes)", ->
    beforeEach ->
      spyOn(@share, "toggle")
    
    it "should call #toggle with passed objects and sharedAttributes", ->
      @share.add ['object1', 'object2'], ['attribute1', 'attribute2']
      expect(@share.toggle).wasCalledWith ['object1', 'object2'], ['attribute1', 'attribute2']

    it "should default sharedAttributes to true", ->
      @share.add ['object1', 'object2']
      expect(@share.toggle).wasCalledWith ['object1', 'object2'], true
  # /#add(objects, sharedAttributes)


  describe "#remove(objects)", ->
    it "should call #toggle with passed objects and false", ->
      spyOn(@share, "toggle")
      @share.remove ['object1', 'object2']
      expect(@share.toggle).wasCalledWith ['object1', 'object2'], false
  # /#remove(objects)


  describe "#toggle(objects, filter)", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "updateAll").andCallFake (objects, updateFunction) ->
        for object in objects
          $.extend object, updateFunction(object)
      @objects = [
        {$type: 'todo', id: '1', title: 'milk'}
        {$type: 'todo', id: '2', title: 'flakes', $shares: {'share1': true}}
        {$type: 'todo', id: '2', title: 'flakes', private: 'note', $shares: {'share1': ['title']}}
      ]
    
    _when "called without filter", ->
      beforeEach ->
        @updatedObjects = @share.toggle @objects

      it "should add unshared objects to the share", ->
        expect(@updatedObjects[0].$shares.share1).toBe true 
      
      it "should remove objects belonging to share", ->
        expect(@updatedObjects[1].$shares).toBe undefined
        expect(@updatedObjects[2].$shares).toBe undefined
  # /#toggle(objects, filter)


  describe "#sync()", ->
    beforeEach ->
      spyOn(@share, "save").andReturn @hoodie.defer().resolve().promise()
      spyOn(@share, "findAllObjects").andReturn ['object1', 'object2']
      spyOn(@hoodie.my.remote, "sync")
      @share.sync()
    
    it "should save the share", ->
      expect(@share.save).wasCalled()

    it "should sync all objects belonging to share", ->
      expect(@hoodie.my.remote.sync).wasCalledWith ['object1', 'object2']
  # /#sync()


  describe "#destroy()", ->
    beforeEach ->
      spyOn(@share, "remove").andReturn @hoodie.defer().resolve().promise()
      spyOn(@share, "findAllObjects").andReturn ['object1', 'object2']
      spyOn(@hoodie.my.store, "destroy")
      @share.destroy()
    
    it "should remove all objects from share", ->
      expect(@share.remove).wasCalledWith ['object1', 'object2']

    it "should remove $share object from store", ->
      expect(@hoodie.my.store.destroy).wasCalledWith '$share', 'share1'
  # /#destroy()


  describe "#findAllObjects()", ->
    beforeEach ->
      spyOn(@hoodie.my.store, "findAll").andReturn 'findAllPromise'
      @share.findAllObjects()
      @filter = @hoodie.my.store.findAll.mostRecentCall.args[0]
      @objects = [
        {$type: 'todo', id: '1', title: 'milk'}
        {$type: 'todo', id: '2', title: 'flakes', $shares: {'share1': true}}
        {$type: 'todo', id: '2', title: 'flakes', private: 'note', $shares: {'share1': ['title']}}
      ]

    it "should return promise by store.findAll", ->
      expect(@share.findAllObjects()).toBe 'findAllPromise'
    
    it "should call findAllObjects with a filter that returns only objects that changed and that belong to share", ->
      expect(@filter @objects[0]).toBe false

      spyOn(@hoodie.my.store, "isDirty").andReturn true
      expect(@filter @objects[1]).toBe true
      expect(@filter @objects[2]).toBe true

      @hoodie.my.store.isDirty.andReturn false
      expect(@filter @objects[1]).toBe false
      expect(@filter @objects[2]).toBe false
  # /#findAllObjects()