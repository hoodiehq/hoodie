define 'specs/remote', ['remote', 'mocks/hoodie', 'mocks/changes_response', 'mocks/changed_docs', 'mocks/bulk_update_response'], (Remote, CangMock, ChangesResponseMock, ChangedDocsMock, BulkUpdateResponseMock) ->
  
  describe "Remote", ->  
    beforeEach ->
      @app    = new CangMock 
      @remote = new Remote @app
      spyOn(@app, "on")
      spyOn(@app, "unbind")
      spyOn(@app, "trigger")
      spyOn(@app, "request")
      spyOn(@app.store, "destroy").andReturn then: (cb) -> cb('object_from_store')
      spyOn(@app.store, "save").andReturn then: (cb) -> cb('object_from_store', false)
      spyOn(window, "setTimeout")
    
    describe ".constructor(@app)", ->
      beforeEach ->
        spyOn(Remote.prototype, "connect")
        @remote = new Remote @app
      
      it "should subscribe to `signed_in` event", ->
        expect(@app.on).wasCalledWith 'account:signed_in', @remote.connect
        
      it "should subscribe to `signed_out` event", ->
        expect(@app.on).wasCalledWith 'account:signed_out', @remote.disconnect
        
      it "should connect", ->
        # why doesn't work @remote.connect?
        expect(Remote::connect).wasCalled()
    # /.constructor(@app)
    
    describe ".connect()", ->  
      beforeEach ->
        spyOn(@remote, "pull_changes")
        spyOn(@remote, "push_changes")
        
      _when "account is authenticated", ->
        beforeEach ->
          spyOn(@app.account, "authenticate").andReturn
            then: (cb) -> cb()
          @remote.connect()
        
        it "should pull changes", ->
          expect(@remote.pull_changes).wasCalled()
        
        it "should push changes", ->
          expect(@remote.push_changes).wasCalled()
        
        it "should subscribe to account's dirty idle event", ->
          expect(@app.on).wasCalledWith 'store:dirty:idle', @remote.push_changes
          
      _when "account is not authenticated", ->
        beforeEach ->
          spyOn(@app.account, "authenticate").andReturn then: -> null
          @remote.connect()
          
        it "shouldn't pull changes", ->
          expect(@remote.pull_changes).wasNotCalled()
        
        it "shouldn't push changes", ->
          expect(@remote.push_changes).wasNotCalled()
        
        it "shouldn't subscribe to account's dirty idle event", ->
          expect(@app.on).wasNotCalled()
    # /.connect()
    
    describe ".disconnect()", ->  
      it "should reset the seq number", ->
        @remote._seq = 123
        spyOn(@app.store.db, "removeItem")
        @remote.disconnect()
        expect(@remote._seq).toBeUndefined()
        expect(@app.store.db.removeItem).wasCalledWith '_couch.remote.seq'
        
      it "should unsubscribe from account's dirty idle event", ->
        @remote.disconnect()
        expect(@app.unbind).wasCalledWith 'store:dirty:idle', @remote.push_changes
    # /.disconnect()
    
    describe ".pull_changes()", ->  
      it "should send a longpoll GET request to user's db _changes feed", ->
        spyOn(@app.account, "user_db").andReturn 'joe$examle_com'
        @remote.pull_changes()
        expect(@app.request).wasCalled()
        [method, path] = @app.request.mostRecentCall.args
        expect(method).toBe 'GET'
        expect(path).toBe '/joe%24examle_com/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=0'
      
      _when "request is successful / returns changes", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.success ChangesResponseMock()
            
          @remote.pull_changes()
        
        it "should remove `todo/abc3` from store", ->
          expect(@app.store.destroy).wasCalledWith 'todo', 'abc3', remote: true

        it "should save `todo/abc2` in store", ->
          expect(@app.store.save).wasCalledWith 'todo', 'abc2', { _rev : '1-123', content : 'remember the milk', done : false, order : 1, type : 'todo', id : 'abc2' }, { remote : true }
        
        it "should trigger remote events", ->
          # {"_id":"todo/abc3","_rev":"2-123","_deleted":true}
          expect(@app.trigger).wasCalledWith 'remote:destroyed', 'todo', 'abc3', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:destroyed:todo',    'abc3', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:destroyed:todo:abc3',       'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed',           'destroyed', 'todo', 'abc3', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed:todo',      'destroyed',         'abc3', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed:todo:abc3', 'destroyed',                 'object_from_store'        
          
          # {"_id":"todo/abc2","_rev":"1-123","content":"remember the milk","done":false,"order":1, "type":"todo"}
          expect(@app.trigger).wasCalledWith 'remote:updated', 'todo', 'abc2', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:updated:todo',    'abc2', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:updated:todo:abc2',       'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed',           'updated', 'todo', 'abc2', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed:todo',      'updated',         'abc2', 'object_from_store'
          expect(@app.trigger).wasCalledWith 'remote:changed:todo:abc2', 'updated',                 'object_from_store'
          
      _when "request errors with 403 unauthorzied", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.error status: 403
        
        it "should disconnect", ->
          spyOn(@remote, "disconnect")
          @remote.pull_changes()
          expect(@remote.disconnect).wasCalled()
          
        it "should trigger an unauthenticated error", ->
          @remote.pull_changes()
          expect(@app.trigger).wasCalledWith 'remote:error:unauthenticated'
          
      _when "request errors with 404 not found", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.error status: 404
        
          
        it "should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", ->
          @remote.pull_changes()
          expect(window.setTimeout).wasCalledWith @remote.pull_changes, 3000
      
      _when "request errors with 500 oooops", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.error status: 500
        
        it "should try again in 3 seconds (and hope it was only a hiccup ...)", ->
          @remote.pull_changes()
          expect(window.setTimeout).wasCalledWith @remote.pull_changes, 3000
          
        it "should trigger a server error event", ->
          @remote.pull_changes()
          expect(@app.trigger).wasCalledWith 'remote:error:server'
          
      _when "request was aborted manually", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.error statusText: 'abort'
        
        it "should try again", ->
          spyOn(@remote, "pull_changes").andCallThrough()
          @remote.pull_changes()
          expect(@remote.pull_changes.callCount).toBe 2
      
      _when "there is a different error", ->
        beforeEach ->
          @app.request.andCallFake (method, path, options) => 
            # avoid endless recursive execution
            @app.request.andCallFake ->
            options.error {}
            
        it "should try again in 3 seconds", ->
          @remote.pull_changes()
          expect(window.setTimeout).wasCalledWith @remote.pull_changes, 3000
    # /.pull_changes()
    
    describe ".push_changes()", ->  
      _when "there are no changed docs", ->
        beforeEach ->
          spyOn(@app.store, "changed_docs").andReturn []
          @remote.push_changes()
          
        it "shouldn't do anything", ->
          expect(@app.request).wasNotCalled()
          
      _when "there is one deleted and one changed doc", ->
        beforeEach ->
          spyOn(@app.store, "changed_docs").andReturn ChangedDocsMock()
          spyOn(@app.account, "user_db").andReturn 'joe$examle_com'
          @remote.push_changes()
          expect(@app.request).wasCalled()
          [@method, @path, @options] = @app.request.mostRecentCall.args
        
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
            @app.request.andCallFake (method, path, options) => 
              options.success BulkUpdateResponseMock()
              
            @remote.push_changes()
            
          it "should trigger conflict event", ->
            expect(@app.trigger).wasCalledWith 'remote:error:conflict', 'todo/abc2'
    # /.push_changes()
    
    describe ".on(event, callback)", ->  
      it "should namespace events with `remote`", ->
        cb = jasmine.createSpy 'test'
        @remote.on 'funky', cb
        expect(@app.on).wasCalledWith 'remote:funky', cb
    # /.on(event, callback)
  # /Remote