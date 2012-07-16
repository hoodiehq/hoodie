describe "Hoodie.Account.RemoteStore", ->  
  beforeEach ->
    @hoodie = new Mocks.Hoodie 
    spyOn(@hoodie, "on")
    spyOn(@hoodie, "one")
    spyOn(@hoodie, "unbind")
    @requestDefer = @hoodie.defer()
    spyOn(@hoodie, "request").andReturn @requestDefer.promise()
    spyOn(window, "setTimeout")
    spyOn(@hoodie.my.account, "db").andReturn 'joe$example.com'
    
    spyOn(@hoodie, "trigger")
    spyOn(@hoodie.my.store, "destroy").andReturn then: (cb) -> cb('objectFromStore')
    spyOn(@hoodie.my.store, "update").andReturn  then: (cb) -> cb('objectFromStore', false)

    @remote = new Hoodie.Account.RemoteStore @hoodie
  
  
  describe ".constructor(@hoodie, options = {})", ->
    beforeEach ->
      spyOn(Hoodie.Account.RemoteStore::, "connect")
      @remote = new Hoodie.Account.RemoteStore @hoodie
    
    it "should set basePath to users database name", ->
      expect(@remote.basePath).toBe "/joe%24example.com"

    it "should sync continously by default", ->
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
    
    it "should connect", ->
      expect(Hoodie.Account.RemoteStore::connect).wasCalled()
        
    _when "config remote.syncContinuously is false", ->
      beforeEach ->
        spyOn(@hoodie.my.config, "get").andReturn false
        @remote = new Hoodie.Account.RemoteStore @hoodie
        
      it "should set syncContinuously to false", ->
        expect(@remote.syncContinuously).toBeFalsy()
     

  describe ".activate", ->
    it "should make isContinuouslySyncing() to return true", ->
      @remote._sync = false
      @remote.activate()
      expect(@remote.isContinuouslySyncing()).toBeTruthy()
    
    it "should set config _remote.sync to true", ->
      spyOn(@hoodie.my.config, "set")
      @remote.activate()
      expect(@hoodie.my.config.set).wasCalledWith '_remote.sync', true

    it "should subscribe to `signedOut` event", ->
      @remote.activate()
      expect(@hoodie.on).wasCalledWith 'account:signedOut', @remote.disconnect

    it "should subscribe to account:signin with sync", ->
      @remote.activate()
      expect(@hoodie.on).wasCalledWith 'account:signedIn', @remote.connect
      
  describe ".deactivate", ->
    it "should set _remote.sync to false", ->
      @remote._sync = true
      @remote.deactivate()
      expect(@remote.isContinuouslySyncing()).toBeFalsy()
    
    it "should set config remote.syncContinuously to false", ->
      spyOn(@hoodie.my.config, "set")
      @remote.deactivate()
      expect(@hoodie.my.config.set).wasCalledWith '_remote.sync', false

    it "should unsubscribe from account's signedIn idle event", ->
      @remote.deactivate()
      expect(@hoodie.unbind).wasCalledWith 'account:signedIn', @remote.connect
      
    it "should unsubscribe from account's signedOut idle event", ->
      @remote.deactivate()
      expect(@hoodie.unbind).wasCalledWith 'account:signedOut', @remote.disconnect

  describe ".connect()", ->
    beforeEach ->
      spyOn(@remote, "sync")
      
    it "should authenticate", ->
      spyOn(@hoodie.my.account, "authenticate").andCallThrough()
      @remote.connect()
      expect(@hoodie.my.account.authenticate).wasCalled()
      
    _when "successful", ->
      beforeEach ->
        spyOn(@hoodie.my.account, "authenticate").andReturn pipe: (cb) -> 
          cb()
          fail: ->
        
      it "should sync", ->
        @remote.connect()
        expect(@remote.sync).wasCalled()
  # /.connect()

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
  
  describe ".pull()", ->        
    beforeEach ->
      @remote.connected = true
    
    _when ".isContinuouslyPulling() is true", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn true
      
      it "should send a longpoll GET request to user's db _changes feed", ->
        @remote.pull()
        expect(@hoodie.request).wasCalled()
        [method, path] = @hoodie.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/joe%24example.com/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=0'
        
      it "should set a timeout to restart the pull request", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote._restartPullRequest, 25000
        
    _when ".isContinuouslyPulling() is false", ->
      beforeEach ->
        spyOn(@remote, "isContinuouslyPulling").andReturn false
      
      it "should send a normal GET request to user's db _changes feed", ->
        @remote.pull()
        expect(@hoodie.request).wasCalled()
        [method, path] = @hoodie.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/joe%24example.com/_changes?include_docs=true&since=0'

    _when "request is successful / returns changes", ->
      beforeEach ->
        @hoodie.request.andReturn then: (success) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
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
        @hoodie.request.andReturn then: (success, error) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
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
        @hoodie.request.andReturn then: (success, error) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
          error status: 404, 'error object'
        
      it "should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000

    _when "request errors with 500 oooops", ->
      beforeEach ->
        @hoodie.request.andReturn then: (success, error) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
          error status: 500, 'error object'
      
      it "should try again in 3 seconds (and hope it was only a hiccup ...)", ->
        @remote.pull()
        expect(window.setTimeout).wasCalledWith @remote.pull, 3000
        
      it "should trigger a server error event", ->
        @remote.pull()
        expect(@hoodie.trigger).wasCalledWith 'remote:error:server', 'error object'
        
    _when "request was aborted manually", ->
      beforeEach ->
        @hoodie.request.andReturn then: (success, error) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
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
        @hoodie.request.andReturn then: (success, error) =>
          # avoid recursion
          @hoodie.request.andReturn then: ->
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
      @defer = @hoodie.defer()
      
    _when "no docs passed", ->        
      _and "there are no changed docs", ->
        beforeEach ->
          spyOn(@hoodie.my.store, "changedDocs").andReturn []
          @remote.push()
      
        it "shouldn't do anything", ->
          expect(@hoodie.request).wasNotCalled()
      
      _and "there is one deleted and one new doc", ->
        beforeEach ->
          spyOn(@hoodie.my.store, "changedDocs").andReturn Mocks.changedDocs()
          @remote.push()
          expect(@hoodie.request).wasCalled()
          [@method, @path, @options] = @hoodie.request.mostRecentCall.args
    
        it "should post the changes to the user's db _bulk_docs API", ->
          expect(@method).toBe 'POST'
          expect(@path).toBe '/joe%24example.com/_bulk_docs'
      
        it "should set dataType to json", ->
          expect(@options.dataType).toBe 'json'
      
        it "should set processData to false", ->
          expect(@options.processData).toBe false
    
        it "should set contentType to 'application/json'", ->
          expect(@options.contentType).toBe 'application/json'
      
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
      
      _when "Array of docs passed", ->
        beforeEach ->
          @todoObjects = [
            {type: 'todo', id: '1'}
            {type: 'todo', id: '2'}
            {type: 'todo', id: '3'}
          ]
          @remote.push @todoObjects
        
        it "should POST the passed objects", ->
          expect(@hoodie.request).wasCalled()
          data = JSON.parse @hoodie.request.mostRecentCall.args[2].data
          expect(data.docs.length).toBe 3
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
  
  describe ".on(event, callback)", ->  
    it "should namespace events with `remote`", ->
      cb = jasmine.createSpy 'test'
      @remote.on 'funky', cb
      expect(@hoodie.on).wasCalledWith 'remote:funky', cb
  # /.on(event, callback)
# /Hoodie.Account.RemoteStore