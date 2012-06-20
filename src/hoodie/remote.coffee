#
# Connection / Socket to our couch
#
# Remote is using couchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#
# When hoodie.remote is active (default), it will continuously 
# synchronize, otherwise you sync, pull or push can be called
# manually
#

define 'hoodie/remote', ['hoodie/errors'], (ERROR) ->
  
  # 'use strict'
  
  class Remote
    
    # ## properties
    
    # active
    # if remote is active, it will continuously synchronize data
    # as soon as the user is authenticated.
    active: true
  
  
    # ## Constructor
    #
    constructor : (@hoodie, options = {}) ->      
      
      # overwrite default with remote.active config, if set
      if @hoodie.config.get('remote.active')?
        @active = @hoodie.config.get('remote.active')
      
      @connect() if @active
      
    # ## Connect
    #
    # start syncing changes from the userDB
    connect : () =>
      @hoodie.config.set 'remote.active', @active = true
      
      @hoodie.on 'account:signed_out',    @disconnect
      @hoodie.on 'account:signed_in',     @sync
      
      # start syncing
      @hoodie.account.authenticate().pipe @sync
    
      
    # ## Disconnect
    #
    # stop syncing changes from the userDB
    disconnect : =>
      @hoodie.config.set 'remote.active',  @active = false
      
      @hoodie.unbind 'account:signed_in',  @sync
      @hoodie.unbind 'account:signed_out', @disconnect
      
      # binding comes from @sync
      @hoodie.unbind 'store:dirty:idle',   @push
      
      # binding comes from 403 unauthorized responses
      @hoodie.unbind 'account:signed_in',  @connect
      
      @_pull_request?.abort()
      @_push_request?.abort()


    # ## pull changes
    #
    # a.k.a. make a GET request to CouchDB's `_changes` feed.
    #
    pull : =>
      @_pull_request = @hoodie.request 'GET', @_pull_url()
      
      if @active
        window.clearTimeout @_pull_request_timeout
        @_pull_request_timeout = window.setTimeout @_restart_pull_request, 25000 # 25 sec
      
      @_pull_request.then @_handle_pull_success, @_handle_pull_error
      
      
    # ## push changes
    #
    # Push objects to userDB using the `_bulk_docs` API.
    # If no objects passed, push all changed documents
    push : (docs) =>
      
      docs = @hoodie.store.changed_docs() unless $.isArray docs
      return @_promise().resolve([]) if docs.length is 0
        
      docs = for doc in docs
        @_parse_for_remote doc 
      
      @_push_request = @hoodie.request 'POST', "/#{encodeURIComponent @hoodie.account.db()}/_bulk_docs", 
        dataType:     'json'
        processData:  false
        contentType:  'application/json'
      
        data        : JSON.stringify(docs: docs)
        success     : @_handle_push
        
    
    # ## sync changes
    #
    # pull ... and push ;-)
    sync : =>
      if @active
        @hoodie.unbind 'store:dirty:idle', @push
        @hoodie.on 'store:dirty:idle',     @push
      
      @pull()
      @push()
      
      
    # ## Get / Set seq
    #
    # the `seq` number gets passed to couchDB's `_changes` feed.
    # 
    get_seq   :       -> @_seq or= @hoodie.config.get('_remote.seq') or 0
    set_seq   : (seq) -> @_seq   = @hoodie.config.set('_remote.seq', seq)
    
    # ## On
    #
    # alias for `hoodie.on`
    on : (event, cb) -> @hoodie.on "remote:#{event}", cb
    
    
    # ## Private
    
    #
    # pull url
    #
    # Depending on whether remote is active, return a longpoll URL or not
    #
    _pull_url : ->
      since = @get_seq()
      if @active # make a long poll request
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=#{since}"
      else
        "/#{encodeURIComponent @hoodie.account.db()}/_changes?include_docs=true&since=#{since}"
    
    # request gets restarted automaticcally in @_handle_pull_error
    _restart_pull_request: => @_pull_request?.abort()
      
    #
    # pull success handler 
    #
    # handle the incoming changes, then send the next request
    #
    _handle_pull_success : (response) =>
      @set_seq response.last_seq
      @_handle_pull_results(response.results)
      
      @pull() if @active
      
    # 
    # pull error handler 
    #
    # when there is a change, trigger event, 
    # then check for another change
    #
    _handle_pull_error : (xhr, error, resp) =>
    
      switch xhr.status
    
        # Session is invalid. User is still login, but needs to reauthenticate
        # before sync can be continued
        when 403
          @hoodie.trigger 'remote:error:unauthenticated', error
          @disconnect()
          @hoodie.one 'account:signed_in', @connect if @active
        
        # the 404 comes, when the requested DB of the User has been removed. 
        # Should really not happen. 
        # 
        # BUT: it might also happen that the profileDB is not ready yet. 
        #      Therefore, we try it again in 3 seconds
        #
        # TODO: review / rethink that.
        when 404
          window.setTimeout @pull, 3000
        
        # Please server, don't give us these. At least not persistently 
        when 500
          @hoodie.trigger 'remote:error:server', error
          window.setTimeout @pull, 3000
        
        # usually a 0, which stands for timeout or server not reachable.
        else
          return unless @active
          if xhr.statusText is 'abort'
            # manual abort after 25sec. restart pulling changes directly when remote is active
            @pull() if @active
          else    
              
            # oops. This might be caused by an unreachable server.
            # Or the server canceld it for what ever reason, e.g.
            # heroku kills the request after ~30s.
            # we'll try again after a 3s timeout
            window.setTimeout @pull, 3000 if @active
  
    # valid couchDB doc attributes starting with an underscore
    _valid_special_attributes: [
      '_id', '_rev', '_deleted'
    ]
  
  
    # parse object for remote storage. All attributes starting with an 
    # `underscore` do not get synchronized despite the special attributes
    # `_id`, `_rev` and `_deleted` (see above)
    # 
    # Also `id` gets replaced with `_id` which consists of type & id
    #
    _parse_for_remote: (obj) ->
      attributes = $.extend {}, obj
    
      for attr of attributes
        continue if ~@_valid_special_attributes.indexOf(attr)
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
      
      # handle id and type
      id = obj._id or obj.id
      delete obj._id
      [obj.type, obj.id] = id.split(/\//)
      
      # handle timestameps
      obj.created_at = new Date(Date.parse obj.created_at) if obj.created_at
      obj.updated_at = new Date(Date.parse obj.updated_at) if obj.updated_at
      
      # handle rev
      if obj.rev
        obj._rev = obj.rev
        delete obj.rev
      
      return obj
  
    #
    # handle changes from remote
    #
    # note: we don't trigger any events until all changes have been taken care of.
    #       Reason is, that on object could depend on a different object that has
    #       not been stored yet, but is within the same bulk of changes. This 
    #       is especially the case during initial bootstraps after a user logins.
    #
    _handle_pull_results: (changes) =>
      _destroyed_docs = []
      _changed_docs   = []
      
      # 1. update or remove objects from local store
      for {doc} in changes
        doc = @_parse_from_remote(doc)
        if doc._deleted
          _destroyed_docs.push [doc, @hoodie.store.destroy  doc.type, doc.id,      remote: true]
        else                                                
          _changed_docs.push   [doc, @hoodie.store.save     doc.type, doc.id, doc, remote: true]
      
      # 2. trigger events
      for [doc, promise] in _destroyed_docs
        promise.then (object) => 
          @hoodie.trigger 'remote:destroyed', doc.type,   doc.id,    object
          @hoodie.trigger "remote:destroyed:#{doc.type}", doc.id,    object
          @hoodie.trigger "remote:destroyed:#{doc.type}:#{doc.id}",  object
          
          @hoodie.trigger 'remote:changed',                       'destroyed', doc.type, doc.id, object
          @hoodie.trigger "remote:changed:#{doc.type}",           'destroyed',            doc.id, object
          @hoodie.trigger "remote:changed:#{doc.type}:#{doc.id}", 'destroyed',                     object
      
      for [doc, promise] in _changed_docs
        promise.then (object, object_was_created) => 
          event = if object_was_created then 'created' else 'updated'
          @hoodie.trigger "remote:#{event}", doc.type,   doc.id,   object
          @hoodie.trigger "remote:#{event}:#{doc.type}", doc.id,   object
          @hoodie.trigger "remote:#{event}:#{doc.type}:#{doc.id}", object
        
          @hoodie.trigger "remote:changed",                       event, doc.type, doc.id, object
          @hoodie.trigger "remote:changed:#{doc.type}",           event,            doc.id, object
          @hoodie.trigger "remote:changed:#{doc.type}:#{doc.id}", event,                     object


    # Gets response to POST _bulk_docs request from couchDB.
    #
    # when remote is active, _rev attributes of the pushed documents don't need
    # to be updated as the continuous pull feed will recognize and handle the changes
    # already.
    #
    # But what needs to be handled are conflicts.
    _handle_push: (doc_responses) =>
      for response in doc_responses
        if response.error is 'conflict'
          @hoodie.trigger 'remote:error:conflict', response.id
        else unless @active
          doc     = @_parse_from_remote(response)
          update  = _rev: doc._rev 
          
          @hoodie.store.update(doc.type, doc.id, update, remote: true)
    
    #
    _promise: $.Deferred