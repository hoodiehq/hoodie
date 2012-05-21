#
# window.localStrage wrapper and more
#

define 'store', ['errors'], (ERROR) ->
  
  # 'use strict'
  
  class Store
  
    # ## Constructor
    #
    constructor : (@app) ->
    
      # if browser does not support local storage persistence,
      # e.g. Safari in private mode, overite the respective methods. 
      unless @is_persistent()
        @db =
          getItem    : -> null
          setItem    : -> null
          removeItem : -> null
          key        : -> null
          length     : -> 0
          clear      : -> null
      
      # handle sign outs
      @app.on 'account:signed_out', @clear
      
    
    # localStorage proxy
    db: 
      getItem    : (key)         -> window.localStorage.getItem(key)
      setItem    : (key, value)  -> window.localStorage.setItem key, value
      removeItem : (key)         -> window.localStorage.removeItem(key)
      key        : (nr)          -> window.localStorage.key(nr)    
      length     : ()            -> window.localStorage.length
      clear      : ()            -> window.localStorage.clear()

    # ## Save
    #
    # saves the passed object into the store and replaces an eventually existing 
    # document with same type & id.
    #
    # When id is undefined, it gets generated an new object gets saved 
    #
    # It also adds timestamps along the way:
    # 
    # * `created_at` unless it already exists
    # * `updated_at` every time
    # * `synced_at`  if changes comes from remote
    #
    #
    # example usage:
    #
    #     store.save('car', undefined, {color: 'red'})
    #     store.save('car', 'abc4567', {color: 'red'})
    save: (type, id, object, options = {}) ->
      defer = @app.defer()
    
      unless typeof object is 'object'
        defer.reject ERROR.INVALID_ARGUMENTS "object is #{typeof object}"
        return defer.promise()
      
      # make sure we don't mess with the passed object directly
      object = $.extend {}, object
      
      # generate an id if necessary
      if id
        is_new = typeof @_cached["#{type}/#{id}"] isnt 'object'
      else
        is_new = true
        id = @uuid()
    
      # validations
      unless @_is_valid_id id
        return defer.reject( ERROR.INVALID_KEY id: id ).promise()
        
      unless @_is_valid_type type
        return defer.reject( ERROR.INVALID_KEY type: type ).promise()
    
      # add timestamps
      if options.remote
        object._synced_at = @_now()
      else
        object.updated_at = @_now()
        object.created_at ||= object.updated_at
    
      # remove `id` and `type` attributes before saving,
      # as the Store key contains this information
      delete object.id
      delete object.type
    
      try 
        object = @cache type, id, object, options
        defer.resolve( object, is_new ).promise()
      catch error
        defer.reject(error).promise()
    
      return defer.promise()
    
    # ## Create
    #
    # `.create` is an alias for `.save`, with the difference that there is no id argument.
    # Internally it simply calls `.save(type, undefined, object).
    create: (type, object, options = {}) ->
      @save type, undefined, object
      
    # ## Update
    #
    # In contrast to `.save`, the `.update` method does not replace the stored object,
    # but only changes the passed attributes of an exsting object, if it exists
    update: (type, id, object_update, options = {}) ->
      
      @load(type, id)
      .pipe (current_obj) => 
        @save(type, id, $.extend(current_obj, object_update))
    
    
    # ## load
    #
    # loads one object from Store, specified by `type` and `id`
    #
    # example usage:
    #
    #     store.load('car', 'abc4567')
    load : (type, id) ->
      defer = @app.defer()
    
      unless typeof type is 'string' and typeof id is 'string'
        return defer.reject( ERROR.INVALID_ARGUMENTS "type & id are required" ).promise()
    
      try
        object = @cache type, id
      
        unless object
          return defer.reject( ERROR.NOT_FOUND type, id ).promise()

        defer.resolve object
      catch error
        defer.reject error
      
      return defer.promise()
  
  
    # ## loadAll
    #
    # returns all objects from store. 
    # Can be filtered by type name and a filter function
    #
    # example usage:
    #
    #     store.loadAll()
    #     store.loadAll('car')
    #     store.loadAll('car', function(obj) { return obj.brand == 'Tesla' })
    loadAll: (type, filter) ->
      defer = @app.defer()
      keys = @_index()
    
      try
        results = switch true
          when !!type and !!filter
            for key in keys when (key.indexOf(type) is 0) and @_is_semantic_id key
              [_type, id] = key.split '/'
              obj = @cache _type, id
              if filter(obj)
                obj
              else
                continue
          when !!type
            for key in keys when (key.indexOf(type) is 0) and @_is_semantic_id key
              [_type, id] = key.split '/'
              @cache _type, id
          else
            for key in keys when @_is_semantic_id key
              [_type, id] = key.split '/'
              @cache _type, id

        defer.resolve(results).promise()
      catch error
        defer.reject(error).promise()
    
      return defer.promise()
    
    
    # ## Delete
    #
    # Deletes one object specified by `type` and `id`. 
    # 
    # when object has been synced before, mark it as deleted. 
    # Otherwise remove it from Store.
    delete : (type, id, options = {}) ->
      defer = @app.defer()
      object  = @cache type, id
      
      unless object
        return defer.reject(ERROR.NOT_FOUND type, id).promise()
      
      if object._synced_at and !options.remote
        object._deleted = true
        @cache type, id, object
      
      else
        key = "#{type}/#{id}"
        @db.removeItem key
    
        @_cached[key] = false
        @clear_changed type, id
    
      defer.resolve($.extend {}, object)
    
    # alias
    destroy: @::delete
    
    
    # ## Cache
    #
    # loads an object specified by `type` and `id` only once from localStorage 
    # and caches it for faster future access. Updates cache when `value` is passed.
    #
    # Also checks if object needs to be synched (dirty) or not 
    #
    # Pass `options.remote = true` when object comes from remote
    cache : (type, id, object = false, options = {}) ->
      key = "#{type}/#{id}"
    
      if object
        @_cached[key] = $.extend object, type: type, id: id
        @_setObject type, id, object
        
        if options.remote
          @clear_changed type, id 
          return $.extend {}, @_cached[key]
      
      else
        return $.extend {}, @_cached[key] if @_cached[key]?
        @_cached[key] = @_getObject type, id
      
      if @_cached[key] and (@_is_dirty(@_cached[key]) or @_is_marked_as_deleted(@_cached[key]))
        @mark_as_changed type, id, @_cached[key]
      else
        @clear_changed type, id
      
      if @_cached[key]
        $.extend {}, @_cached[key]
      else
        @_cached[key]
  
  
    # ## Clear changed 
    #
    # removes an object from the list of objects that are flagged to by synched (dirty)
    # and triggers a `store:dirty` event
    clear_changed : (type, id) ->
    
      if type and id
        key = "#{type}/#{id}"
        delete @_dirty[key]
      else
        @_dirty = {}
    
      @app.trigger 'store:dirty'
    
    
    # ## Marked as deleted?
    #
    # when an object gets deleted that has been synched before (`_rev` attribute),
    # it cannot be removed from store but gets a `_deleted: true` attribute
    is_marked_as_deleted : (type, id) ->
      @_is_marked_as_deleted @cache(type, id)
        
    
    # ## Mark as changed
    #
    # Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a 
    # `store:dirty:idle` event once there is no change within 2 seconds
    mark_as_changed : (type, id, object) ->
      key = "#{type}/#{id}"
      
      @_dirty[key] = object
      @app.trigger 'store:dirty'
      
      timeout = 2000 # 2 seconds timout before triggering the `store:dirty:idle` event
      window.clearTimeout @_dirty_timeout
      @_dirty_timeout = window.setTimeout ( => @app.trigger 'store:dirty:idle' ), timeout
      
    # ## changed docs
    #
    # returns an Array of all dirty documents
    changed_docs : -> 
      object for key, object of @_dirty
      
         
    # ## Is dirty?
    #
    # When no arguments passed, returns `true` or `false` depending on if there are
    # dirty objects in the store.
    #
    # Otherwise it returns `true` or `false` for the passed object. An object is dirty
    # if it has no `_synced_at` attribute or if `updated_at` is more recent than `_synced_at`
    is_dirty : (type, id) ->
      unless type
        return $.isEmptyObject @_dirty
        
      @_is_dirty @cache(type, id)
  
  
    # ## Clear
    #
    # clears localStorage and cache
    # TODO: do not clear entire localStorage, clear only item that have been stored before
    clear : =>
      defer = @app.defer()
    
      try
        @db.clear()
        @_cached = {}
        @clear_changed()
      
        defer.resolve()
      catch error
        defer.reject(error)
      
      return defer.promise()
    
  
    # ## Is persistant?
    #
    # returns `true` or `false` depending on whether localStorage is supported or not.
    # Beware that some browsers like Safari do not support localStorage in private mode.
    #
    # inspired by this cappuccino commit
    # https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
    #
    is_persistent : ->
    
      try 
        # pussies ... we've to put this in here. I've seen Firefox throwing `Security error: 1000`
        # when cookies have been disabled
        return false unless window.localStorage
      
        # Just because localStorage exists does not mean it works. In particular it might be disabled
        # as it is when Safari's private browsing mode is active.
        localStorage.setItem('Storage-Test', "1");
      
        # hmm ... ?
        return false unless localStorage.getItem('Storage-Test') is "1"
      
        # okay, let's clean up if we got here.
        localStorage.removeItem('Storage-Test');
    
      catch e
      
        # in case of an error, like Safari's Private Pussy, return false
        return false
      
      # good, good
      return true
    
    
    # ## UUID
    #
    # helper to generate uuids.
    uuid : (len = 7) ->
      chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
      radix = chars.length
      (
        chars[ 0 | Math.random()*radix ] for i in [0...len]
      ).join('')
    
    # ## Private
    
    # more advanced localStorage wrappers to load/store objects
    _setObject : (type, id, object) ->
      key = "#{type}/#{id}"
      store = $.extend {}, object
      delete store.type
      delete store.id
      @db.setItem key, JSON.stringify store
      
    _getObject : (type, id) ->
      key = "#{type}/#{id}"
      json = @db.getItem(key)
      if json
        obj = JSON.parse(json)
        obj.type  = type
        obj.id    = id
        
        obj.created_at = new Date(Date.parse obj.created_at) if obj.created_at
        obj.updated_at = new Date(Date.parse obj.updated_at) if obj.updated_at
        obj._synced_at = new Date(Date.parse obj._synced_at) if obj._synced_at
        
        obj
      else
        false
  
    #
    _now : -> new Date
  
    # only lowercase letters and numbers are allowed for ids
    _is_valid_id : (key) ->
      /^[a-z0-9]+$/.test key
      
    # just like ids, but must start with a letter or a $ (internal types)
    _is_valid_type : (key) ->
      /^[a-z$][a-z0-9]+$/.test key
      
    _is_semantic_id : (key) ->
      /^[a-z$][a-z0-9]+\/[a-z0-9]+$/.test key

    # cache of localStorage for quicker access
    _cached : {}
  
    # map of dirty objects by their ids
    _dirty : {}
    
    # is dirty?
    _is_dirty : (object) ->
      
      return true  unless object._synced_at  # no synced_at? uuhh, that's dirty.
      return false unless object.updated_at # no updated_at? no dirt then
    
      object._synced_at.getTime() < object.updated_at.getTime()
  
    # marked as deleted?
    _is_marked_as_deleted : (object) ->
      object._deleted is true

    # document key index
    #
    # TODO: make this cachy
    _index : ->
      @db.key(i) for i in [0...@db.length()]