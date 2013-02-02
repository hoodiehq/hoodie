describe "Hoodie.RemoteStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    spyOn(window, "setTimeout")
    spyOn(@hoodie.account, "db").andReturn 'joe$example.com'

    @remote        = new Hoodie.Remote @hoodie
    @remote.prefix = 'remote_prefix'
    @remote.name   = 'remote_name'
    @requestDefer  = @hoodie.defer()
    spyOn(@remote, "request").andReturn @requestDefer.promise()
    @remoteStore = new Hoodie.RemoteStore @hoodie, @remote
  
  
  describe "constructor(@remote)", ->
    
    it "should set @remote", ->
      remoteStore = new Hoodie.RemoteStore @hoodie, @remote
      expect(remoteStore.remote).toBe @remote
  # /constructor

  describe "#find(type, id)", ->

    _when "request successful", ->
      beforeEach ->
        @remoteStore.remote.prefix = 'store_prefix'
        @requestDefer.resolve
          _id: 'store_prefix/car/fresh'
          createdAt: '2012-12-12T22:00:00.000Z'
          updatedAt: '2012-12-21T22:00:00.000Z'
      
      it "should resolve with the doc", ->
        expect(@remoteStore.find("todo", "1")).toBeResolvedWith
          id: 'fresh'
          type: 'car'
          createdAt: new Date(Date.parse '2012-12-12T22:00:00.000Z')
          updatedAt: new Date(Date.parse '2012-12-21T22:00:00.000Z')
  # /#find(type, id)


  describe "#findAll(type)", ->
    
    it "should return a promise", ->
      expect(@remoteStore.findAll()).toBePromise()

    _when "type is not set", ->
      _and "prefix is empty", ->
        beforeEach ->
          @remoteStore.remote.prefix = ''
        
        it "should send a GET to /_all_docs?include_docs=true", ->
          @remoteStore.findAll()
          expect(@remoteStore.remote.request).wasCalledWith "GET", "/_all_docs?include_docs=true"

      _and "prefix is '$public'", ->
        beforeEach ->
          @remoteStore.remote.prefix = '$public'
        
        it "should send a GET to /_all_docs?include_docs=true", ->
          @remoteStore.findAll()
          expect(@remoteStore.remote.request).wasCalledWith "GET", '/_all_docs?include_docs=true&startkey="$public/"&endkey="$public0"'

    _when "type is todo", ->
      it 'should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', ->
        @remoteStore.findAll('todo')
        expect(@remoteStore.remote.request).wasCalledWith "GET", '/_all_docs?include_docs=true&startkey="remote_prefix/todo/"&endkey="remote_prefix/todo0"'

    _when "request success", ->
      beforeEach ->
        @doc = 
          _id: 'car/fresh'
          createdAt: '2012-12-12T22:00:00.000Z'
          updatedAt: '2012-12-21T22:00:00.000Z'

        @requestDefer.resolve 
          total_rows:3
          offset:0
          rows: [
            doc: @doc
          ]

      it "should be resolved with array of objects", ->
        object = 
          id: 'fresh'
          type: 'car'
          createdAt: new Date (Date.parse '2012-12-12T22:00:00.000Z')
          updatedAt: new Date (Date.parse '2012-12-21T22:00:00.000Z')
        expect(@remoteStore.findAll()).toBeResolvedWith [object]

    _when "request has an error", ->
      beforeEach ->
        @requestDefer.reject "error"

      it "should be rejected with the response error", ->
        promise = @remoteStore.findAll()
        expect(promise).toBeRejectedWith "error"
  # /#findAll(type )


  describe "#save(type, id, object)", ->
    beforeEach ->
      spyOn(@hoodie, "uuid").andReturn "uuid567"
    
    it "should generate an id if it is undefined", ->
      @remoteStore.save("car", undefined, {})
      expect(@hoodie.uuid).wasCalled()

    it "should not generate an id if id is set", ->
      spyOn(@remoteStore, "_generateNewRevisionId").andReturn 'newRevId'
      @remoteStore.save("car", 123, {})
      expect(@hoodie.uuid).wasNotCalled()

    it "should return promise by @request", ->
      @remote.request.andReturn 'request_promise'
      expect(@remoteStore.save("car", 123, {})).toBe 'request_promise'
    
    _when "saving car/123 with color: red", ->
      beforeEach ->
        
        @remoteStore.save "car", 123, color: "red"
        [@type, @path, {@data}] = @remoteStore.remote.request.mostRecentCall.args

      it "should send a PUT request to `/remote_prefix%2Fcar%2F123`", ->
        expect(@type).toBe 'PUT'
        expect(@path).toBe '/remote_prefix%2Fcar%2F123'

      it "should add type to saved object", -> 
        expect(@data.type).toBe 'car'

      it "should set _id to `car/123`", ->
        expect(@data._id).toBe 'remote_prefix/car/123'

      it "should not generate a _rev", ->
        expect(@data._rev).toBeUndefined()
  # /#save(type, id, object)


  describe "#remove(type, id)", ->
    beforeEach ->
      spyOn(@remoteStore, "update").andReturn "update_promise"
    
    it "should proxy to update with _deleted: true", ->
      @remoteStore.remove 'car', 123
      expect(@remoteStore.update).wasCalledWith 'car', 123, _deleted: true
    
    it "should return promise of update", ->
       expect(@remoteStore.remove 'car', 123).toBe 'update_promise'    
  # /#remove(type, id)


  describe "#removeAll(type)", ->
    beforeEach ->
      spyOn(@remoteStore, "updateAll").andReturn "updateAll_promise"
    
    it "should proxy to updateAll with _deleted: true", ->
      @remoteStore.removeAll 'car'
      expect(@remoteStore.updateAll).wasCalledWith 'car', _deleted: true
    
    it "should return promise of updateAll", ->
       expect(@remoteStore.removeAll 'car').toBe 'updateAll_promise'
  # /#removeAll(type)

  
  describe "#on(event, callback)", ->  
    it "should namespace events with `name`", ->
      cb = jasmine.createSpy 'test'
      @remoteStore.on 'funky', cb
      expect(@hoodie.on).wasCalledWith 'remote_name:store:funky', cb

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @remoteStore.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'remote_name:store:super remote_name:store:funky remote_name:store:fresh', cb
  # /#on(event, callback)


  describe "#one(event, callback)", ->  
    it "should namespace events with `name`", ->
      cb = jasmine.createSpy 'test'
      @remoteStore.on 'funky', cb
      expect(@hoodie.on).wasCalledWith 'remote_name:store:funky', cb

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @remoteStore.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'remote_name:store:super remote_name:store:funky remote_name:store:fresh', cb
  # /#on(event, callback)


  describe "#trigger(event, parameters...)", ->  
    it "should namespace events with `name`", ->
      cb = jasmine.createSpy 'test'
      @remoteStore.trigger 'funky', cb
      expect(@hoodie.trigger).wasCalledWith 'remote_name:store:funky', cb
# /Hoodie.RemoteStore