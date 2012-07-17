describe "Hoodie.RemoteStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    @requestDefer = @hoodie.defer()
    spyOn(window, "setTimeout")
    spyOn(@hoodie.my.account, "db").andReturn 'joe$example.com'
    
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie.my.store, "destroy").andReturn then: (cb) -> cb('objectFromStore')
    spyOn(@hoodie.my.store, "update").andReturn  then: (cb) -> cb('objectFromStore', false)

    @remote = new Hoodie.RemoteStore @hoodie
  
  
  describe ".constructor(@hoodie, options = {})", ->

    it "should set @basePath", ->
      remote = new Hoodie.RemoteStore @hoodie, basePath: '/base/path'
      expect(remote.basePath).toBe '/base/path'

    it "should default @basePath to ''", ->
      remote = new Hoodie.RemoteStore @hoodie
      expect(remote.basePath).toBe ''

    it "should set _sync to false by default", ->
      remote = new Hoodie.RemoteStore @hoodie
      expect(remote._sync).toBe false

    it "should set _sync to false from pased sync option", ->
      remote = new Hoodie.RemoteStore @hoodie, sync: true
      expect(remote._sync).toBe true
    
    
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

  describe "request(type, path, options)", ->
    beforeEach ->
      spyOn(@hoodie, "request")
    
    it "should proxy to hoodie.request", ->
      @remote.request("GET", "/something")
      expect(@hoodie.request).wasCalled()

    it "should set options.contentType to 'application/json'", ->
      @remote.request("GET", "/something")
      expect(@hoodie.request).wasCalledWith "GET", "/something", contentType: 'application/json'

    it "should prefix path with @basePath", ->
      @remote.basePath = "/my/store"
      @remote.request("GET", "/something")
      [type, path] = @hoodie.request.mostRecentCall.args
      expect(path).toBe '/my/store/something'

    _when "type is POST", ->
      beforeEach ->
        @remote.request("POST", "/something")
        [type, path, @options] = @hoodie.request.mostRecentCall.args

      it "should default options.dataType to 'json'", ->
        expect(@options.dataType).toBe 'json'
      
      it "should default options.dataType to 'json'", ->
        expect(@options.processData).toBe false
    
    
  # /get(view, params)

  describe "get(view, params)", ->
  # /get(view, params)
  
  describe "post(view, params)", ->
  # /post(view, params)


  # synchronization
  # -----------------

  describe ".connect()", ->
    beforeEach ->
      spyOn(@remote, "sync")
    
    it "should set connected to true", ->
      @remote.connected = false
      @remote.connect()
      expect(@remote.connected).toBe true
            

    it "should sync", ->
      @remote.connect()
      expect(@remote.sync).wasCalled()

  describe ".disconnect()", ->  
    it "should abort the pull request", ->
      @remote._pullRequest = abort: jasmine.createSpy 'pull'
      @remote.disconnect()
      expect(@remote._pullRequest.abort).wasCalled()
    
    it "should abort the push request", ->
      @remote._pushRequest = abort: jasmine.createSpy 'push'
      @remote.disconnect()
      expect(@remote._pushRequest.abort).wasCalled()
      
    it "should unsubscribe from stores's dirty idle event", ->
      @remote.disconnect()
      expect(@hoodie.unbind).wasCalledWith 'store:dirty:idle', @remote.push
  # /.disconnect()

  describe ".isContinuouslyPulling()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslyPulling()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslyPulling()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return true", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslyPulling()).toBe true

    _when "remote._sync is push: true", ->
      it "should return false", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslyPulling()).toBe false
  # /.isContinuouslySyncing()

  describe ".isContinuouslyPushing()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslyPushing()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslyPushing()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return false", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslyPushing()).toBe false

    _when "remote._sync is push: true", ->
      it "should return true", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslyPushing()).toBe true
  # /.isContinuouslySyncing()

  describe ".isContinuouslySyncing()", ->
    _when "remote._sync is false", ->
      it "should return false", ->
        @remote._sync = false
        expect(@remote.isContinuouslySyncing()).toBe false

    _when "remote._sync is true", ->
      it "should return true", ->
        @remote._sync = true
        expect(@remote.isContinuouslySyncing()).toBe true

    _when "remote._sync is pull: true", ->
      it "should return false", ->
        @remote._sync = pull: true
        expect(@remote.isContinuouslySyncing()).toBe false

    _when "remote._sync is push: true", ->
      it "should return false", ->
        @remote._sync = push: true
        expect(@remote.isContinuouslySyncing()).toBe false
  # /.isContinuouslySyncing()

  describe ".getSinceNr()", ->
    _when "since not set before", ->
      it "should return 0", ->
        expect(@remote._since).toBe undefined
        expect(@remote.getSinceNr()).toBe 0

    _when "since set to 100 before", ->
      beforeEach ->
        @remote.setSinceNr(100)

      it "should return 100", ->
        expect(@remote.getSinceNr()).toBe 100
  # /.getSinceNr()

  describe ".setSinceNr(since)", ->
    it "should set _since property", ->
      expect(@remote._since).toBe undefined
      @remote.setSinceNr(100)
      expect(@remote._since).toBe 100
  # /.setSinceNr()

  describe ".pull()", ->        
    beforeEach ->
      @remote.connected = true
      spyOn(@remote, "request").andReturn @requestDefer.promise()
    
    _when ".isContinuouslyPulling() is true", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn true
      
      it "should send a longpoll GET request to the _changes feed", ->
        @remote.pull()
        expect(@remote.request).wasCalled()
        [method, path] = @remote.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=0'
        
      it "should set a timeout to restart the pull request", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote._restartPullRequest, 25000
        
    _when ".isContinuouslyPulling() is false", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn false
      
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
      
      it "should remove `todo/abc3` from store", ->
        @remote.pull()
        expect(@hoodie.my.store.destroy).wasCalledWith 'todo', 'abc3', remote: true

      it "should save `todo/abc2` in store", ->
        @remote.pull()
        expect(@hoodie.my.store.update).wasCalledWith 'todo', 'abc2', { _rev : '1-123', content : 'remember the milk', done : false, order : 1, type : 'todo', id : 'abc2' }, { remote : true }
      
      it "should trigger remote events", ->
        @remote.pull()

        # {"_id":"todo/abc3","_rev":"2-123","_deleted":true}
        expect(@hoodie.trigger).wasCalledWith 'remote:destroy',           'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:destroy:todo',      'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:destroy:todo:abc3', 'objectFromStore'

        expect(@hoodie.trigger).wasCalledWith 'remote:change',            'destroy', 'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:change:todo',       'destroy', 'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:change:todo:abc3',  'destroy', 'objectFromStore'        
        
        # {"_id":"todo/abc2","_rev":"1-123","content":"remember the milk","done":false,"order":1, "type":"todo"}
        expect(@hoodie.trigger).wasCalledWith 'remote:update',            'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:update:todo',       'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:update:todo:abc2',  'objectFromStore'

        expect(@hoodie.trigger).wasCalledWith 'remote:change',            'update', 'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:change:todo',       'update', 'objectFromStore'
        expect(@hoodie.trigger).wasCalledWith 'remote:change:todo:abc2',  'update', 'objectFromStore'
        
      _and ".isContinuouslyPulling() returns true", ->
        beforeEach ->
          spyOn(@remote, "isContinuouslyPulling").andReturn true
          spyOn(@remote, "pull").andCallThrough()
        
        it "should pull again", ->
          @remote.pull()
          expect(@remote.pull.callCount).toBe 2
        
    _when "request errors with 403 unauthorzied", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error status: 403, 'error object'
          
        spyOn(@remote, "disconnect")
      
      it "should disconnect", ->
        @remote.pull()
        expect(@remote.disconnect).wasCalled()
        
      it "should trigger an unauthenticated error", ->
        @remote.pull()
        expect(@hoodie.trigger).wasCalledWith 'remote:error:unauthenticated', 'error object'
      
      _and "remote is pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = true
      
      _and "remote isn't pullContinuously", ->
        beforeEach ->
          @remote.pullContinuously = false

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
        @remote.pull()
        expect(@hoodie.trigger).wasCalledWith 'remote:error:server', 'error object'
        
    _when "request was aborted manually", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error statusText: 'abort', 'error object'
      
      it "should try again when .isContinuouslyPulling() returns true", ->
        spyOn(@remote, "pull").andCallThrough()
        spyOn(@remote, "isContinuouslyPulling").andReturn true
        @remote.pull()
        expect(@remote.pull.callCount).toBe 2
        
        @remote.pull.reset()
        @remote.isContinuouslyPulling.andReturn false
        @remote.pull()
        expect(@remote.pull.callCount).toBe 1

    _when "there is a different error", ->
      beforeEach ->
        @remote.request.andReturn then: (success, error) =>
          # avoid recursion
          @remote.request.andReturn then: ->
          error {}, 'error object'
          
      it "should try again in 3 seconds if .isContinuouslyPulling() returns false", ->
        spyOn(@remote, "isContinuouslyPulling").andReturn true
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
        window.setTimeout.reset()
        @remote.isContinuouslyPulling.andReturn false
        @remote.pull()
        expect(window.setTimeout).wasNotCalledWith @remote.pull, 3000
  # /.pull()

  describe ".push(docs)", -> 
    beforeEach ->
      spyOn(Date, "now").andReturn 10
      @remote._timezoneOffset = 1
      spyOn(@remote, "request").andReturn @requestDefer.promise()
      
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
        data = JSON.parse @remote.request.mostRecentCall.args[2].data
        expect(data.docs.length).toBe 3

    _and "one deleted and one new doc passed", ->
      beforeEach ->
        @remote.push Mocks.changedDocs()
        expect(@remote.request).wasCalled()
        [@method, @path, @options] = @remote.request.mostRecentCall.args
  
      it "should post the changes to the user's db _bulk_docs API", ->
        expect(@method).toBe 'POST'
        expect(@path).toBe '/_bulk_docs'
    
      it "should send the docs in appropriate format", ->
        {docs} = JSON.parse @options.data
        doc = docs[0]
        expect(doc.id).toBeUndefined()
        expect(doc._id).toBe 'todo/abc3'
        expect(doc._localInfo).toBeUndefined()

      it "should set data.newEdits to false", ->
        {newEdits} = JSON.parse @options.data
        expect(newEdits).toBe false

      it "should set new _revision ids", ->
        {docs} = JSON.parse @options.data
        [deletedDoc, newDoc] = docs
        expect(deletedDoc._rev).toBe '3-mock567#11'
        expect(newDoc._rev).toMatch '1-mock567#11'

        expect(deletedDoc._revisions.start).toBe 3
        expect(deletedDoc._revisions.ids[0]).toBe 'mock567#11'
        expect(deletedDoc._revisions.ids[1]).toBe '123'

        expect(newDoc._revisions.start).toBe 1
        expect(newDoc._revisions.ids[0]).toBe 'mock567#11'
  # /.push(docs)

  describe ".sync(docs)", ->
    beforeEach ->
      spyOn(@remote, "push").andCallFake (docs) -> pipe: (cb) -> cb(docs)
      spyOn(@remote, "pull")
    
    it "should push changes and pass arguments", ->
      @remote.sync [1,2,3]
      expect(@remote.push).wasCalledWith [1,2,3]

    it "should pull changes and pass arguments", ->
      @remote.sync [1,2,3]
      expect(@remote.pull).wasCalledWith [1,2,3]
      
    _when ".isContinuouslyPushing() returns true", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPushing").andReturn true
        
      it "should bind to store:dirty:idle event", ->
        @remote.sync()
        expect(@hoodie.on).wasCalledWith 'store:dirty:idle', @remote.push
        
      it "should unbind from store:dirty:idle event before it binds to it", ->
        order = []
        @hoodie.unbind.andCallFake (event) -> order.push "unbind #{event}"
        @hoodie.on.andCallFake (event) -> order.push "bind #{event}"
        @remote.sync()
        expect(order[0]).toBe 'unbind store:dirty:idle'
        expect(order[1]).toBe 'bind store:dirty:idle'
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