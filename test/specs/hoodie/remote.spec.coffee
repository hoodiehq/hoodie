define 'specs/hoodie/remote', ['hoodie/remote', 'mocks/hoodie', 'mocks/changes_response', 'mocks/changed_docs', 'mocks/bulk_update_response'], (Remote, HoodieMock, ChangesResponseMock, ChangedDocsMock, BulkUpdateResponseMock) ->
  
  describe "Remote", ->  
    beforeEach ->
      @hoodie = new HoodieMock 
      @remote = new Remote @hoodie
      spyOn(@hoodie, "on")
      spyOn(@hoodie, "one")
      spyOn(@hoodie, "unbind")
      spyOn(@hoodie, "request").andReturn then: jasmine.createSpy 'then'
      spyOn(window, "setTimeout")
      
      spyOn(@hoodie, "trigger")
      spyOn(@hoodie.store, "destroy").andReturn then: (cb) -> cb('object_from_store')
      spyOn(@hoodie.store, "save").andReturn    then: (cb) -> cb('object_from_store', false)
    
    
    describe ".constructor(@hoodie, options = {})", ->
      beforeEach ->
        spyOn(Remote::, "connect")
        @remote = new Remote @hoodie
      
      it "should be active by default", ->
        expect(@remote.active).toBeTruthy()
      
      it "should connect", ->
        expect(Remote::connect).wasCalled()
          
      _when "config remote.active is false", ->
        beforeEach ->
          spyOn(@hoodie.config, "get").andReturn false
          @remote = new Remote @hoodie
          
        it "should set active to false", ->
          expect(@remote.active).toBeFalsy()
       
        
    describe ".connect()", ->
      beforeEach ->
        spyOn(@remote, "sync")
      
      it "should set remote.active to true", ->
        @remote.active = false
        @remote.connect()
        expect(@remote.active).toBeTruthy()
      
      it "should set config remote.active to true", ->
        spyOn(@hoodie.config, "set")
        @remote.connect()
        expect(@hoodie.config.set).wasCalledWith 'remote.active', true
        
      it "should subscribe to `signed_out` event", ->
        @remote.connect()
        expect(@hoodie.on).wasCalledWith 'account:signed_out', @remote.disconnect
        
      it "should authenticate", ->
        spyOn(@hoodie.account, "authenticate").andCallThrough()
        @remote.connect()
        expect(@hoodie.account.authenticate).wasCalled()
        
      _when "successful", ->
        beforeEach ->
          spyOn(@hoodie.account, "authenticate").andReturn pipe: (cb) -> 
            cb()
            fail: ->
          
        it "should sync", ->
          @remote.connect()
          expect(@remote.sync).wasCalled()
        
      _when "not successful", ->
        beforeEach ->
          spyOn(@hoodie.account, "authenticate").andReturn pipe: -> fail: (cb) -> cb()
        
        it "should subscribe to account:sign_in with sync", ->
          @remote.connect()
          expect(@hoodie.on).wasCalledWith 'account:signed_in', @remote.sync
    # /.connect()

    describe ".disconnect()", ->  
      it "should set remote.active to false", ->
        @remote.active = true
        @remote.disconnect()
        expect(@remote.active).toBeFalsy()
      
      it "should set config remote.active to true", ->
        spyOn(@hoodie.config, "set")
        @remote.disconnect()
        expect(@hoodie.config.set).wasCalledWith 'remote.active', false
        
      it "should abort the pull request", ->
        @remote._pull_request = abort: jasmine.createSpy 'pull'
        @remote.disconnect()
        expect(@remote._pull_request.abort).wasCalled()
      
      it "should abort the push request", ->
        @remote._push_request = abort: jasmine.createSpy 'push'
        @remote.disconnect()
        expect(@remote._push_request.abort).wasCalled()
        
      it "should unsubscribe from stores's dirty idle event", ->
        @remote.disconnect()
        expect(@hoodie.unbind).wasCalledWith 'store:dirty:idle', @remote.push
        
      it "should unsubscribe from account's signed_in idle event", ->
        @remote.disconnect()
        expect(@hoodie.unbind).wasCalledWith 'account:signed_in', @remote.connect
        
      it "should unsubscribe from account's signed_out idle event", ->
        @remote.disconnect()
        expect(@hoodie.unbind).wasCalledWith 'account:signed_out', @remote.disconnect
    # /.disconnect()
    
    describe ".pull()", ->  
      # it "shold handle the request response", ->
      #   @remote.pull()
      #   expect(@hoodie.request().then).wasCalledWith @remote._changes_success, @remote._changes_error
      
      _when "remote is active", ->
        beforeEach ->
          @remote.active = true
        
        it "should send a longpoll GET request to user's db _changes feed", ->
          spyOn(@hoodie.account, "db").andReturn 'joe$examle_com'
          @remote.pull()
          expect(@hoodie.request).wasCalled()
          [method, path] = @hoodie.request.mostRecentCall.args
          expect(method).toBe 'GET'
          expect(path).toBe '/joe%24examle_com/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=0'
          
        it "should set a timeout to restart the pull request", ->
          @remote.pull()
          expect(window.setTimeout).wasCalledWith @remote._restart_pull_request, 25000
          
      _when "remote is not active", ->
        beforeEach ->
          @remote.active = false
        
        it "should send a normal GET request to user's db _changes feed", ->
          spyOn(@hoodie.account, "db").andReturn 'joe$examle_com'
          @remote.pull()
          expect(@hoodie.request).wasCalled()
          [method, path] = @hoodie.request.mostRecentCall.args
          expect(method).toBe 'GET'
          expect(path).toBe '/joe%24examle_com/_changes?include_docs=true&since=0'

      _when "request is successful / returns changes", ->
        beforeEach ->
          @hoodie.request.andReturn then: (success) =>
            # avoid recursion
            @hoodie.request.andReturn then: ->
            success ChangesResponseMock()
        
        it "should remove `todo/abc3` from store", ->
          @remote.pull()
          expect(@hoodie.store.destroy).wasCalledWith 'todo', 'abc3', remote: true
  
        it "should save `todo/abc2` in store", ->
          @remote.pull()
          expect(@hoodie.store.save).wasCalledWith 'todo', 'abc2', { _rev : '1-123', content : 'remember the milk', done : false, order : 1, type : 'todo', id : 'abc2' }, { remote : true }
        
        it "should trigger remote events", ->
          @remote.pull()
          # {"_id":"todo/abc3","_rev":"2-123","_deleted":true}
          expect(@hoodie.trigger).wasCalledWith 'remote:destroyed', 'todo', 'abc3', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:destroyed:todo',    'abc3', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:destroyed:todo:abc3',       'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed',           'destroyed', 'todo', 'abc3', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed:todo',      'destroyed',         'abc3', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed:todo:abc3', 'destroyed',                 'object_from_store'        
          
          # {"_id":"todo/abc2","_rev":"1-123","content":"remember the milk","done":false,"order":1, "type":"todo"}
          expect(@hoodie.trigger).wasCalledWith 'remote:updated', 'todo', 'abc2', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:updated:todo',    'abc2', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:updated:todo:abc2',       'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed',           'updated', 'todo', 'abc2', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed:todo',      'updated',         'abc2', 'object_from_store'
          expect(@hoodie.trigger).wasCalledWith 'remote:changed:todo:abc2', 'updated',                 'object_from_store'
          
        _and "remote is active", ->
          beforeEach ->
            @remote.active = true
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
        
        _and "remote is active", ->
          beforeEach ->
            @remote.active = true
            
          it "should reconnect when reauthenticated", ->
            @remote.pull()
            expect(@hoodie.one).wasCalledWith 'account:signed_in', @remote.connect
        
        _and "remote isn't active", ->
          beforeEach ->
            @remote.active = false
            
          it "should not reconnect when reauthenticated", ->
            @remote.pull()
            expect(@hoodie.one).wasNotCalledWith 'account:signed_in', @remote.connect

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
        
        it "should try again when remote is active", ->
          spyOn(@remote, "pull").andCallThrough()
          
          @remote.active = true
          @remote.pull()
          expect(@remote.pull.callCount).toBe 2
          
          @remote.pull.reset()
          @remote.active = false
          @remote.pull()
          expect(@remote.pull.callCount).toBe 1

      _when "there is a different error", ->
        beforeEach ->
          @hoodie.request.andReturn then: (success, error) =>
            # avoid recursion
            @hoodie.request.andReturn then: ->
            error {}, 'error object'
            
        it "should try again in 3 seconds if remote is active", ->
          @remote.active = true
          @remote.pull()
          expect(window.setTimeout).wasCalledWith @remote.pull, 3000
          
          window.setTimeout.reset()
          @remote.active = false
          @remote.pull()
          expect(window.setTimeout).wasNotCalledWith @remote.pull, 3000
    # /.pull()
    
    

    describe ".push(docs)", ->  
      _when "no docs passed", ->        
        _and "there are no changed docs", ->
          beforeEach ->
            spyOn(@hoodie.store, "changed_docs").andReturn []
            @remote.push()
        
          it "shouldn't do anything", ->
            expect(@hoodie.request).wasNotCalled()
        
        _and "there is one deleted and one changed doc", ->
          beforeEach ->
            spyOn(@hoodie.store, "changed_docs").andReturn ChangedDocsMock()
            spyOn(@hoodie.account, "db").andReturn 'joe$examle_com'
            @remote.push()
            expect(@hoodie.request).wasCalled()
            [@method, @path, @options] = @hoodie.request.mostRecentCall.args
      
          it "should post the changes to the user's db _bulk_docs API", ->
            expect(@method).toBe 'POST'
            expect(@path).toBe '/joe%24examle_com/_bulk_docs'
        
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
        
          _and "the request is successful, but with one conflict error", ->
            beforeEach ->
              @hoodie.request.andCallFake (method, path, options) => 
                options.success BulkUpdateResponseMock()
            
              @remote.push()
          
            it "should trigger conflict event", ->
              expect(@hoodie.trigger).wasCalledWith 'remote:error:conflict', 'todo/abc2'
        
        _when "Array of docs passed", ->
          beforeEach ->
            @todo_objects = [
              {type: 'todo', id: '1'}
              {type: 'todo', id: '2'}
              {type: 'todo', id: '3'}
            ]
            @remote.push @todo_objects
          
          it "should POST the passed objects", ->
            expect(@hoodie.request).wasCalled()
            data = JSON.parse @hoodie.request.mostRecentCall.args[2].data
            expect(data.docs.length).toBe 3
    # /.push(docs)
    
    describe ".on(event, callback)", ->  
      it "should namespace events with `remote`", ->
        cb = jasmine.createSpy 'test'
        @remote.on 'funky', cb
        expect(@hoodie.on).wasCalledWith 'remote:funky', cb
    # /.on(event, callback)
  # /Remote