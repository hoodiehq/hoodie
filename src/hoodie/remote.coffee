#
# Connection / Socket to our couch
#
# Remote is using couchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#

define 'hoodie/remote', ['hoodie/errors'], (ERROR) ->
  
  # 'use strict'
  
  class Remote
  
    # ## Constructor
    #
    constructor : (@hoodie) ->
      
      @hoodie.on 'account:signed_in',  @connect
      @hoodie.on 'account:signed_out', @disconnect
      @hoodie.account.authenticate().then @connect
      
      
    # ## Connect
    #
    # start pulling changes from the userDB
    connect : =>
      
      return if @_connected
      @hoodie.on 'store:dirty:idle', @push_changes
      @pull_changes()
      @push_changes()
    
      
    # ## Disconnect
    #
    # stop pulling changes from the userDB
    disconnect : =>
      @_connected = false
      @_changes_request?.abort()
      
      @reset_seq()
      @hoodie.unbind 'store:dirty:idle', @push_changes


    # ## pull changes
    #
    # a.k.a. make a longpoll AJAX request to CouchDB's `_changes` feed.
    #
    pull_changes: =>
      @_connected = true
      
      @_changes_request = @hoodie.request 'GET', @_changes_path(),
        success:      @_changes_success
        error:        @_changes_error
      
      window.clearTimeout @_changes_request_timeout
      @_changes_request_timeout = window.setTimeout @_restart_changes_request, 25000 # 25 sec
      
      
    # ## Push changes
    #
    # Push locally changed objects to userDB using the
    # using the `_bulk_docs` API
    push_changes : () =>

      docs    = @hoodie.store.changed_docs()
      return @_promise().resolve([]) if docs.length is 0
        
      docs = for doc in docs
        @_parse_for_remote doc 
      
      @hoodie.request 'POST', "/#{encodeURIComponent @hoodie.account.user_db()}/_bulk_docs", 
        dataType:     'json'
        processData:  false
        contentType:  'application/json'
      
        data        : JSON.stringify(docs: docs)
        success     : @_handle_push_changes
      
      
    # ## Get / Set seq
    #
    # the `seq` number gets passed to couchDB's `_changes` feed.
    # 
    get_seq   :       -> @_seq or= @hoodie.store.db.getItem('_couch.remote.seq') or 0
    set_seq   : (seq) -> @_seq   = @hoodie.store.db.setItem('_couch.remote.seq', seq)
    reset_seq : -> 
      @hoodie.store.db.removeItem '_couch.remote.seq'
      delete @_seq
    
    
    # ## On
    #
    # alias for `hoodie.on`
    on : (event, cb) -> @hoodie.on "remote:#{event}", cb
    
    
    # ## Private
    
    #
    # changes url
    #
    # long poll url with heartbeat = 10 seconds
    #
    _changes_path : ->
      since = @get_seq()
      "/#{encodeURIComponent @hoodie.account.user_db()}/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=#{since}"
    
    # request gets restarted automaticcally in @_changes_error
    _restart_changes_request: => @_changes_request?.abort()
      
    #
    # changes success handler 
    #
    # handle the incoming changes, then send the next request
    #
    _changes_success : (response) =>
      
      return unless @_connected
      @set_seq response.last_seq
      @_handle_pull_changes(response.results)
      do @pull_changes
      
    # 
    # changes error handler 
    #
    # when there is a change, trigger event, 
    # then check for another change
    #
    _changes_error : (xhr, error, resp) =>
      return unless @_connected
    
      switch xhr.status
    
        # This happens when users session got invalidated on server
        when 403
          @hoodie.trigger 'remote:error:unauthenticated'
          do @disconnect
        
        # the 404 comes, when the requested DB of the User has been removed. 
        # Should really not happen. 
        # 
        # BUT: it might also happen that the profileDB is not ready yet. 
        #      Therefore, we try it again in 3 seconds
        #
        # TODO: review / rethink that.
        when 404
          window.setTimeout @pull_changes, 3000
        
        # Please server, don't give us these. At least not persistently 
        when 500
          @hoodie.trigger 'remote:error:server'
          window.setTimeout @pull_changes, 3000
        
        # usually a 0, which stands for timeout or server not reachable.
        else
          if xhr.statusText is 'abort'
            # manual abort after 25sec. reload changes directly.
            do @pull_changes
          else    
              
            # oops. This might be caused by an unreachable server.
            # Or the server canceld it for what ever reason, e.g.
            # heroku kills the request after ~30s.
            # we'll try again after a 3s timeout
            window.setTimeout @pull_changes, 3000
  
    # map of valid couchDB doc attributes starting with an underscore
    _valid_special_attributes:
      '_id'      : 1
      '_rev'     : 1
      '_deleted' : 1
  
  
    # parse object for remote storage. All attributes starting with an 
    # `underscore` do not get synchronized despite the special attributes
    # `_id`, `_rev` and `_deleted`
    # 
    # Also `id` attribute gets renamed to `_id`
    #
    _parse_for_remote: (obj) ->
      attributes = $.extend {}, obj
    
      for attr of attributes
        continue if @_valid_special_attributes[attr]
        continue unless /^_/.test attr
        delete attributes[attr]
     
      attributes._id = "#{attributes.type}/#{attributes.id}"
      delete attributes.id
      
      return attributes
      
      
    # parse object for local storage. 
    # 
    # renames `_id` attribute to `id` and removes the type from the id,
    # e.g. `document/123` -> `123`
    _parse_from_remote: (obj) ->
      id = obj._id or obj.id
      delete obj._id
      if id is undefined
        console.log 'obj'
        console.log JSON.stringify obj
        
      [obj.type, obj.id] = id.split(/\//)
      
      obj.created_at = new Date(Date.parse obj.created_at) if obj.created_at
      obj.updated_at = new Date(Date.parse obj.updated_at) if obj.updated_at
      
      return obj
  
    #
    # handle changes from remote
    #
    _handle_pull_changes: (changes) =>
      for {doc} in changes
        _doc = @_parse_from_remote(doc)
        if _doc._deleted
          @hoodie.store.destroy(_doc.type, _doc.id, remote: true)
          .then (object) => 
            @hoodie.trigger 'remote:destroyed', _doc.type,   _doc.id,    object
            @hoodie.trigger "remote:destroyed:#{_doc.type}", _doc.id,    object
            @hoodie.trigger "remote:destroyed:#{_doc.type}:#{_doc.id}",  object
            
            @hoodie.trigger 'remote:changed',                         'destroyed', _doc.type, _doc.id, object
            @hoodie.trigger "remote:changed:#{_doc.type}",            'destroyed',            _doc.id, object
            @hoodie.trigger "remote:changed:#{_doc.type}:#{_doc.id}", 'destroyed',                     object
        else
          @hoodie.store.save(_doc.type, _doc.id, _doc, remote: true)
          .then (object, object_was_created) => 
            if object_was_created
              @hoodie.trigger 'remote:created', _doc.type,   _doc.id,   object
              @hoodie.trigger "remote:created:#{_doc.type}", _doc.id,   object
              @hoodie.trigger "remote:created:#{_doc.type}:#{_doc.id}", object
              
              @hoodie.trigger 'remote:changed',                         'created', _doc.type, _doc.id, object
              @hoodie.trigger "remote:changed:#{_doc.type}",            'created',            _doc.id, object
              @hoodie.trigger "remote:changed:#{_doc.type}:#{_doc.id}", 'created',                     object
            else
              @hoodie.trigger 'remote:updated', _doc.type,   _doc.id,   object
              @hoodie.trigger "remote:updated:#{_doc.type}", _doc.id,   object
              @hoodie.trigger "remote:updated:#{_doc.type}:#{_doc.id}", object
              
              @hoodie.trigger 'remote:changed',                         'updated', _doc.type, _doc.id, object
              @hoodie.trigger "remote:changed:#{_doc.type}",            'updated',            _doc.id, object
              @hoodie.trigger "remote:changed:#{_doc.type}:#{_doc.id}", 'updated',                     object
        

    # Gets response to POST _bulk_docs request from couchDB.
    # Updates to documents (e.g. new _rev stamps) come through the _changes feed anyway
    # and do not need to handle it twice. 
    #
    # But what needs to be handled are conflicts.
    _handle_push_changes: (doc_responses) =>
      for response in doc_responses when response.error is 'conflict'
        @hoodie.trigger 'remote:error:conflict', response.id
    
    #
    _promise: $.Deferred