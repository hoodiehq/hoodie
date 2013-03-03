describe "Hoodie.Remote", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    @requestDefer = @hoodie.defer()
    spyOn(window, "setTimeout")
    spyOn(@hoodie.account, "db").andReturn 'joe$example.com'

    @remote = new Hoodie.Remote @hoodie
    spyOn(@remote, "request").andReturn @requestDefer.promise()
  
  describe "constructor(@hoodie, options = {})", ->
    beforeEach ->
      spyOn(Hoodie.Remote::, "connect")
    
    it "should set @name from options", ->
      remote = new Hoodie.Remote @hoodie, name: 'base/path'
      expect(remote.name).toBe 'base/path'

    it "should default connected to false", ->
      remote = new Hoodie.Remote @hoodie
      expect(remote.connected).toBe false

    it "should fallback prefix to ''", ->
      remote = new Hoodie.Remote @hoodie
      expect(remote.prefix).toBe ''

    _when "connected: true passed", ->
      beforeEach ->
        @remote = new Hoodie.Remote @hoodie, connected: true
      
      it "should set @connected to true", ->
        expect(@remote.connected).toBe true

      it "should start syncing", ->
        expect(Hoodie.Remote::connect).wasCalled()

    _when "prefix: $public passed", ->
      beforeEach ->
        @remote = new Hoodie.Remote @hoodie, prefix: '$public'
      
      it "should set prefix accordingly", ->
        expect(@remote.prefix).toBe '$public'
  # /constructor


  # custom requests
  # -----------------

  describe "#request(type, path, options)", ->
    beforeEach ->
      @remote.request.andCallThrough()
      spyOn(@hoodie, "request")
    
    it "should proxy to hoodie.request", ->
      @remote.request("GET", "/something")
      expect(@hoodie.request).wasCalled()

    it "should set options.contentType to 'application/json'", ->
      @remote.request("GET", "/something")
      expect(@hoodie.request).wasCalledWith "GET", "/something", contentType: 'application/json'

    it "should prefix path with @name (encoded)", ->
      @remote.name = "my/store"
      @remote.request("GET", "/something")
      [type, path] = @hoodie.request.mostRecentCall.args
      expect(path).toBe '/my%2Fstore/something'

    _when "type is POST", ->
      beforeEach ->
        @remote.request("POST", "/something")
        [type, path, @options] = @hoodie.request.mostRecentCall.args

      it "should default options.dataType to 'json'", ->
        expect(@options.dataType).toBe 'json'
      
      it "should default options.dataType to 'json'", ->
        expect(@options.processData).toBe false
  # /#request(type, path, options)

  describe "get(view, params)", ->
  # /get(view, params)
  
  describe "post(view, params)", ->
  # /post(view, params)


  # Store operations
  # ------------------

  describe "#find(type, id)", ->

    it "should send a GET request to `/type%2Fid`", ->
      @remote.find('car', '123')
      [type, path] = @remote.request.mostRecentCall.args
      expect(type).toBe 'GET'
      expect(path).toBe '/car%2F123'

    _when "prefix is store_prefix/", ->
      beforeEach ->
        @remote.prefix = 'store_prefix/'
      
      it "should send request to `store_prefix%2Ftype%2Fid`", ->
        @remote.find('car', '123')
        [type, path] = @remote.request.mostRecentCall.args
        expect(type).toBe 'GET'
        expect(path).toBe '/store_prefix%2Fcar%2F123'

      _and "request successful", ->
        beforeEach ->
          @requestDefer.resolve
            _id: 'store_prefix/car/fresh'
            createdAt: '2012-12-12T22:00:00.000Z'
            updatedAt: '2012-12-21T22:00:00.000Z'
        
        it "should resolve with the doc", ->
          expect(@remote.find("todo", "1")).toBeResolvedWith
            id: 'fresh'
            type: 'car'
            createdAt: new Date(Date.parse '2012-12-12T22:00:00.000Z')
            updatedAt: new Date(Date.parse '2012-12-21T22:00:00.000Z')
  # /#find(type, id)


  describe "#findAll(type)", ->
    
    it "should return a promise", ->
      expect(@remote.findAll()).toBePromise()

    _when "type is not set", ->
      _and "prefix is empty", ->
        beforeEach ->
          @remote.prefix = ''
        
        it "should send a GET to /_all_docs?include_docs=true", ->
          @remote.findAll()
          expect(@remote.request).wasCalledWith "GET", "/_all_docs?include_docs=true"

      _and "prefix is '$public'", ->
        beforeEach ->
          @remote.prefix = '$public/'
        
        it "should send a GET to /_all_docs?include_docs=true&startkey=\"$public/\"&endkey=\"$public0\"", ->
          @remote.findAll()
          expect(@remote.request).wasCalledWith "GET", '/_all_docs?include_docs=true&startkey="%24public%2F"&endkey="%24public0"'

    _when "type is todo", ->
      it 'should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', ->
        @remote.findAll('todo')
        expect(@remote.request).wasCalledWith "GET", '/_all_docs?include_docs=true&startkey="todo%2F"&endkey="todo0"'

      _and "prefix is 'remote_prefix'", ->
        beforeEach ->
          @remote.prefix = 'remote_prefix/'
        
        it 'should send a GET to /_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"', ->
          @remote.findAll('todo')
          expect(@remote.request).wasCalledWith "GET", '/_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"'

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
        expect(@remote.findAll()).toBeResolvedWith [object]

    _when "request has an error", ->
      beforeEach ->
        @requestDefer.reject "error"

      it "should be rejected with the response error", ->
        promise = @remote.findAll()
        expect(promise).toBeRejectedWith "error"
  # /#findAll(type )


  describe "#save(type, id, object)", ->
    beforeEach ->
      spyOn(@hoodie, "uuid").andReturn "uuid567"
    
    it "should generate an id if it is undefined", ->
      @remote.save("car", undefined, {})
      expect(@hoodie.uuid).wasCalled()

    it "should not generate an id if id is set", ->
      spyOn(@remote, "_generateNewRevisionId").andReturn 'newRevId'
      @remote.save("car", 123, {})
      expect(@hoodie.uuid).wasNotCalled()

    it "should return promise by @request", ->
      @remote.request.andReturn 'request_promise'
      expect(@remote.save("car", 123, {})).toBe 'request_promise'
    
    _when "saving car/123 with color: red", ->
      beforeEach ->        
        @remote.save "car", 123, color: "red"
        [@type, @path, {@data}] = @remote.request.mostRecentCall.args

      it "should send a PUT request to `/car%2F123`", ->
        expect(@type).toBe 'PUT'
        expect(@path).toBe '/car%2F123'

      it "should add type to saved object", -> 
        expect(@data.type).toBe 'car'

      it "should set _id to `car/123`", ->
        expect(@data._id).toBe 'car/123'

      it "should not generate a _rev", ->
        expect(@data._rev).toBeUndefined()

    _when "saving car/123 with color: red and prefix is 'remote_prefix'", ->
      beforeEach ->        
        @remote.prefix = 'remote_prefix/'
        @remote.save "car", 123, color: "red"
        [@type, @path, {@data}] = @remote.request.mostRecentCall.args

      it "should send a PUT request to `/remote_prefix%2Fcar%2F123`", ->
        expect(@type).toBe 'PUT'
        expect(@path).toBe '/remote_prefix%2Fcar%2F123'

      it "should set _id to `remote_prefix/car/123`", ->
        expect(@data._id).toBe 'remote_prefix/car/123'
  # /#save(type, id, object)


  describe "#remove(type, id)", ->
    beforeEach ->
      spyOn(@remote, "update").andReturn "update_promise"
    
    it "should proxy to update with _deleted: true", ->
      @remote.remove 'car', 123
      expect(@remote.update).wasCalledWith 'car', 123, _deleted: true
    
    it "should return promise of update", ->
       expect(@remote.remove 'car', 123).toBe 'update_promise'    
  # /#remove(type, id)


  describe "#removeAll(type)", ->
    beforeEach ->
      spyOn(@remote, "updateAll").andReturn "updateAll_promise"
    
    it "should proxy to updateAll with _deleted: true", ->
      @remote.removeAll 'car'
      expect(@remote.updateAll).wasCalledWith 'car', _deleted: true
    
    it "should return promise of updateAll", ->
       expect(@remote.removeAll 'car').toBe 'updateAll_promise'
  # /#removeAll(type)



  # synchronization
  # -----------------

  describe "#connect()", ->
    beforeEach ->
      spyOn(@remote, "pull")
    
    it "should set connected to true", ->
      @remote.connected = false
      @remote.connect()
      expect(@remote.connected).toBe true

    it "should pull", ->
      @remote.connect()
      expect(@remote.pull).wasCalled()
  # /#connect()

  describe "#disconnect()", ->  
    it "should abort the pull request", ->
      @remote._pullRequest = abort: jasmine.createSpy 'pull'
      @remote.disconnect()
      expect(@remote._pullRequest.abort).wasCalled()
    
    it "should abort the push request", ->
      @remote._pushRequest = abort: jasmine.createSpy 'push'
      @remote.disconnect()
      expect(@remote._pushRequest.abort).wasCalled()
  # /#disconnect()

  describe "#getSinceNr()", ->
    _when "since not set before", ->
      it "should return 0", ->
        expect(@remote._since).toBe undefined
        expect(@remote.getSinceNr()).toBe 0

    _when "since set to 100 before", ->
      beforeEach ->
        @remote.setSinceNr(100)

      it "should return 100", ->
        expect(@remote.getSinceNr()).toBe 100
  # /#getSinceNr()

  describe "#setSinceNr(since)", ->
    it "should set _since property", ->
      expect(@remote._since).toBe undefined
      @remote.setSinceNr(100)
      expect(@remote._since).toBe 100
  # /#setSinceNr()

  describe "#pull()", ->        
    beforeEach ->
      @remote.connected = true
    
    _when ".isConnected() is true", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn true
      
      it "should send a longpoll GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll'
        
      it "should set a timeout to restart the pull request", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote._restartPullRequest, 25000
        
    _when ".isConnected() is false", ->
      beforeEach ->
        spyOn(@remote, "isConnected").andReturn false
      
      it "should send a normal GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&since=0'

    _when "request is successful / returns changes", ->
      beforeEach ->
        @remote.request.andReturn then: (success) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          success Mocks.changesResponse()
      
      it "should trigger remote events", ->
        spyOn(@remote, "trigger")
        @remote.pull()

        # {"_id":"todo/abc3","_rev":"2-123","_deleted":true}
        object =
          'type'  : 'todo'
          id       : 'abc3'
          _rev     : '2-123'
          _deleted : true
        expect(@remote.trigger).wasCalledWith 'remove',           object
        expect(@remote.trigger).wasCalledWith 'remove:todo',      object
        expect(@remote.trigger).wasCalledWith 'remove:todo:abc3', object

        expect(@remote.trigger).wasCalledWith 'change',            'remove', object
        expect(@remote.trigger).wasCalledWith 'change:todo',       'remove', object
        expect(@remote.trigger).wasCalledWith 'change:todo:abc3',  'remove', object        
        
        # {"_id":"todo/abc2","_rev":"1-123","content":"remember the milk","done":false,"order":1, "type":"todo"}
        object =
          'type'  : 'todo'
          id       : 'abc2'
          _rev     : '1-123'
          content  : 'remember the milk'
          done     :false
          order    :1
        expect(@remote.trigger).wasCalledWith 'add',            object
        expect(@remote.trigger).wasCalledWith 'add:todo',       object
        expect(@remote.trigger).wasCalledWith 'add:todo:abc2',  object

        expect(@remote.trigger).wasCalledWith 'change',            'add', object
        expect(@remote.trigger).wasCalledWith 'change:todo',       'add', object
        expect(@remote.trigger).wasCalledWith 'change:todo:abc2',  'add', object
        
      _and ".isConnected() returns true", ->
        beforeEach ->
          spyOn(@remote, "isConnected").andReturn true
          spyOn(@remote, "pull").andCallThrough()
        
        it "should pull again", ->
          @remote.pull()
          expect(@remote.pull.callCount).toBe 2
        
    _when "request errors with 401 unauthorzied", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 401, 'error object'
          
        spyOn(@remote, "disconnect")
      
      it "should disconnect", ->
        @remote.pull()
        expect(@remote.disconnect).wasCalled()
        
      it "should trigger an unauthenticated error", ->
        spyOn(@remote, "trigger")
        @remote.pull()
        expect(@remote.trigger).wasCalledWith 'error:unauthenticated', 'error object'

    _when "request errors with 404 not found", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 404, 'error object'
        
      it "should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000

    _when "request errors with 500 oooops", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 500, 'error object'
      
      it "should try again in 3 seconds (and hope it was only a hiccup ...)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
      it "should trigger a server error event", ->
        spyOn(@remote, "trigger")
        @remote.pull()
        expect(@remote.trigger).wasCalledWith 'error:server', 'error object'
        
    _when "request was aborted manually", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error statusText: 'abort', 'error object'

        spyOn(@remote, "pull").andCallThrough()
      
      _and "is connected", ->
        beforeEach ->
          spyOn(@remote, "isConnected").andReturn true

        it "should pull again", ->
          @remote.pull()
          expect(@remote.pull.callCount).toBe 2
        
      _and "is not connected", ->
        beforeEach ->
          spyOn(@remote, "isConnected").andReturn false

        it "should not pull again", ->
          @remote.pull()
          expect(@remote.pull.callCount).toBe 1

    _when "there is a different error", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error {}, 'error object'
          
      it "should try again in 3 seconds if .isConnected() returns false", ->
        spyOn(@remote, "isConnected").andReturn true
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
        window.setTimeout.reset()
        @remote.isConnected.andReturn false
        @remote.pull()
        expect(window.setTimeout).wasNotCalledWith @remote.pull, 3000
  # /#pull()

  describe "#push(docs)", -> 
    beforeEach ->
      spyOn(Date, "now").andReturn 10
      @remote._timezoneOffset = 1
      
    _when "no docs passed", ->        
      it "shouldn't do anything", ->
        @remote.push()
        @remote.push([])
        expect(@remote.request).wasNotCalled()

    _when "Array of docs passed", ->
      beforeEach ->
        @todoObjects = [
          {type: 'todo', id: '1'}
          {type: 'todo', id: '2'}
          {type: 'todo', id: '3'}
        ]
        @remote.push @todoObjects
      
      it "should POST the passed objects", ->
        expect(@remote.request).wasCalled()
        data = @remote.request.mostRecentCall.args[2].data
        expect(data.docs.length).toBe 3

    _and "one deleted and one new doc passed", ->
      beforeEach ->
        @remote.push Mocks.changedObjects()
        expect(@remote.request).wasCalled()
        [@method, @path, @options] = @remote.request.mostRecentCall.args
  
      it "should post the changes to the user's db _bulk_docs API", ->
        expect(@method).toBe 'POST'
        expect(@path).toBe '/_bulk_docs'
    
      it "should send the docs in appropriate format", ->
        {docs} = @options.data
        doc = docs[0]
        expect(doc.id).toBeUndefined()
        expect(doc._id).toBe 'todo/abc3'
        expect(doc._localInfo).toBeUndefined()

      it "should set data.new_edits to false", ->
        {new_edits} = @options.data
        expect(new_edits).toBe false

      it "should set new _revision ids", ->
        {docs} = @options.data
        [deletedDoc, newDoc] = docs
        expect(deletedDoc._rev).toBe '3-uuid'
        expect(newDoc._rev).toMatch '1-uuid'

        expect(deletedDoc._revisions.start).toBe 3
        expect(deletedDoc._revisions.ids[0]).toBe 'uuid'
        expect(deletedDoc._revisions.ids[1]).toBe '123'

        expect(newDoc._revisions.start).toBe 1
        expect(newDoc._revisions.ids[0]).toBe 'uuid'

    _when "prefix set to $public", ->
      beforeEach ->
        @remote.prefix = '$public/'
        @todoObjects = [
          {type: 'todo', id: '1'}
          {type: 'todo', id: '2'}
          {type: 'todo', id: '3'}
        ]
        @remote.push @todoObjects
      
      it "should prefix all document IDs with '$public/'", ->
        expect(@remote.request).wasCalled()
        data = @remote.request.mostRecentCall.args[2].data
        expect(data.docs[0]._id).toBe '$public/todo/1'
  # /#push(docs)

  describe "#sync(docs)", ->
    beforeEach ->
      spyOn(@remote, "push").andCallFake (docs) -> pipe: (cb) -> cb(docs)
      spyOn(@remote, "pull")
    
    it "should push changes and pass arguments", ->
      @remote.sync [1,2,3]
      expect(@remote.push).wasCalledWith [1,2,3]

    it "should pull changes and pass arguments", ->
      @remote.sync [1,2,3]
      expect(@remote.pull).wasCalledWith [1,2,3]
  # /#sync(docs)


  # events
  # --------
  
  describe "#on(event, callback)", ->  
    it "should namespace events with `name`", ->
      cb = jasmine.createSpy 'test'
      @remote.name = 'databaseName'
      @remote.on 'funky', cb
      expect(@hoodie.on).wasCalledWith 'databaseName:funky', cb

    it "should namespace multiple events correctly", ->
      cb = jasmine.createSpy 'test'
      @remote.name = 'databaseName'
      @remote.on 'super funky fresh', cb
      expect(@hoodie.on).wasCalledWith 'databaseName:super databaseName:funky databaseName:fresh', cb
  # /#on(event, callback)

  describe "#trigger(event, parameters...)", ->  
    it "should namespace events with `name`", ->
      cb = jasmine.createSpy 'test'
      @remote.name = 'databaseName'
      @remote.trigger 'funky', cb
      expect(@hoodie.trigger).wasCalledWith 'databaseName:funky', cb
# /Hoodie.Remote