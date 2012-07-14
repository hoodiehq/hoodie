#
# window.localStrage wrapper and more
#

class Hoodie.LocalStore

  # ## Constructor
  #
  constructor : (@hoodie) ->
  
    # if browser does not support local storage persistence,
    # e.g. Safari in private mode, overite the respective methods. 
    unless @isPersistent()
      @db =
        getItem    : -> null
        setItem    : -> null
        removeItem : -> null
        key        : -> null
        length     : -> 0
        clear      : -> null
    
    # handle sign outs
    @hoodie.on 'account:signout', @clear
    
  
  # localStorage proxy
  db : 
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
  # * `createdAt` unless it already exists
  # * `updatedAt` every time
  # * `syncedAt`  if changes comes from remote
  #
  #
  # example usage:
  #
  #     store.save('car', undefined, {color: 'red'})
  #     store.save('car', 'abc4567', {color: 'red'})
  save : (type, id, object, options = {}) ->
    defer = @hoodie.defer()
  
    unless typeof object is 'object'
      defer.reject Hoodie.Errors.INVALID_ARGUMENTS "object is #{typeof object}"
      return defer.promise()
    
    # make sure we don't mess with the passed object directly
    object = $.extend {}, object
    
    # validations
    if id and not @_isValidId id
      return defer.reject( Hoodie.Errors.INVALID_KEY id: id ).promise()
      
    unless @_isValidType type
      return defer.reject( Hoodie.Errors.INVALID_KEY type: type ).promise()
    
    # generate an id if necessary
    if id
      isNew = typeof @_cached["#{type}/#{id}"] isnt 'object'
    else
      isNew = true
      id     = @uuid()

    # handle public option
    object.$public = options.public if options.public?
  
    # add timestamps
    if options.remote
      object._syncedAt = @_now()
    else unless options.silent
      object.updatedAt = @_now()
      object.createdAt or= object.updatedAt
  
    # remove `id` and `type` attributes before saving,
    # as the Store key contains this information
    delete object.id
    delete object.type
  
    try 
      object = @cache type, id, object, options
      defer.resolve( object, isNew ).promise()
    catch error
      defer.reject(error).promise()
  
    return defer.promise()
  
  
  # ## Create
  #
  # `.create` is an alias for `.save`, with the difference that there is no id argument.
  # Internally it simply calls `.save(type, undefined, object).
  create : (type, object, options = {}) ->
    @save type, undefined, object
  
  
  # ## Update
  #
  # In contrast to `.save`, the `.update` method does not replace the stored object,
  # but only changes the passed attributes of an exsting object, if it exists
  #
  # both a hash of key/values or a function that applies the update to the passed
  # object can be passed.
  #
  # example usage
  #
  # hoodie.my.localStore.update('car', 'abc4567', {sold: true})
  # hoodie.my.localStore.update('car', 'abc4567', function(obj) { obj.sold = true })
  update : (type, id, objectUpdate, options = {}) ->
    defer = @hoodie.defer()
    
    _loadPromise = @load(type, id).pipe (currentObj) => 
      
      # normalize input
      objectUpdate = objectUpdate( $.extend {}, currentObj ) if typeof objectUpdate is 'function'
      
      return defer.resolve currentObj unless objectUpdate
      
      # check if something changed
      changedProperties = for key, value of objectUpdate when currentObj[key] isnt value
        # workaround for undefined values, as $.extend ignores these
        currentObj[key] = value
        key
        
      return defer.resolve currentObj unless changedProperties.length
      
      # apply update 
      @save(type, id, currentObj, options).then defer.resolve, defer.reject
      
    # if not found, create it
    _loadPromise.fail => 
      @save(type, id, objectUpdate, options).then defer.resolve, defer.reject
    
    defer.promise()
  
  
  # ## updateAll
  #
  # update all objects in the store, can be optionally filtered by a function
  # As an alternative, an array of objects can be passed
  #
  # example usage
  #
  # hoodie.my.localStore.updateAll()
  updateAll : (filterOrObjects, objectUpdate, options = {}) ->
    
    # normalize the input: make sure we have all objects
    if @hoodie.isPromise(filterOrObjects)
      promise = filterOrObjects
    else
      promise = @hoodie.defer().resolve( filterOrObjects ).resolve()
    
    promise.pipe (objects) =>
      
      # no we update all objects one by one and return a promise
      # that will be resolved once all updates have been finished
      defer = @hoodie.defer()
      _updatePromises = for object in objects
        @update(object.type, object.id, objectUpdate, options) 
      $.when.apply(null, _updatePromises).then defer.resolve
      
      return defer.promise()
  
  
  # ## load
  #
  # loads one object from Store, specified by `type` and `id`
  #
  # example usage:
  #
  #     store.load('car', 'abc4567')
  load : (type, id) ->
    defer = @hoodie.defer()
  
    unless typeof type is 'string' and typeof id is 'string'
      return defer.reject( Hoodie.Errors.INVALID_ARGUMENTS "type & id are required" ).promise()
  
    try
      object = @cache type, id
    
      unless object
        return defer.reject( Hoodie.Errors.NOT_FOUND type, id ).promise()

      defer.resolve object
    catch error
      defer.reject error
    
    return defer.promise()
  
  
  # ## loadAll
  #
  # returns all objects from store. 
  # Can be optionally filtered by a type or a function
  #
  # example usage:
  #
  #     store.loadAll()
  #     store.loadAll('car')
  #     store.loadAll(function(obj) { return obj.brand == 'Tesla' })
  loadAll: (filter = -> true) ->
    defer = @hoodie.defer()
    keys = @_index()

    # t
    if typeof filter is 'string'
      type   = filter
      filter = (obj) -> obj.type is type
  
    try
      # coffeescript gathers the result of the respective for key in keys loops
      # and returns it as array, which will be stored in the results variable
      results = for key in keys when @_isSemanticId key
        [currentType, id] = key.split '/'
        
        obj = @cache currentType, id
        if filter(obj)
          obj
        else
          continue

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
    defer = @hoodie.defer()
    object  = @cache type, id
    
    unless object
      return defer.reject(Hoodie.Errors.NOT_FOUND type, id).promise()
    
    if object._syncedAt and not options.remote
      object._deleted = true
      @cache type, id, object
    
    else
      key = "#{type}/#{id}"
      @db.removeItem key
  
      @_cached[key] = false
      @clearChanged type, id
  
    defer.resolve($.extend {}, object).promise()
  
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
        @clearChanged type, id 
        return $.extend {}, @_cached[key]
    
    else
      return $.extend {}, @_cached[key] if @_cached[key]?
      @_cached[key] = @_getObject type, id
    
    if @_cached[key] and (@_isDirty(@_cached[key]) or @_isMarkedAsDeleted(@_cached[key]))
      @markAsChanged type, id, @_cached[key]
    else
      @clearChanged type, id
    
    if @_cached[key]
      $.extend {}, @_cached[key]
    else
      @_cached[key]


  # ## Clear changed 
  #
  # removes an object from the list of objects that are flagged to by synched (dirty)
  # and triggers a `store:dirty` event
  clearChanged : (type, id) ->
  
    if type and id
      key = "#{type}/#{id}"
      delete @_dirty[key]
    else
      @_dirty = {}
  
    @hoodie.trigger 'store:dirty'
  
  
  # ## Marked as deleted?
  #
  # when an object gets deleted that has been synched before (`_rev` attribute),
  # it cannot be removed from store but gets a `_deleted: true` attribute
  isMarkedAsDeleted : (type, id) ->
    @_isMarkedAsDeleted @cache(type, id)
      
  
  # ## Mark as changed
  #
  # Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a 
  # `store:dirty:idle` event once there is no change within 2 seconds
  markAsChanged : (type, id, object) ->
    key = "#{type}/#{id}"
    
    @_dirty[key] = object
    @hoodie.trigger 'store:dirty'

    timeout = 2000 # 2 seconds timout before triggering the `store:dirty:idle` event
    window.clearTimeout @_dirtyTimeout
    @_dirtyTimeout = window.setTimeout ( =>
      @hoodie.trigger 'store:dirty:idle'
    ), timeout
    
  # ## changed docs
  #
  # returns an Array of all dirty documents
  changedDocs : -> 
    object for key, object of @_dirty
    
       
  # ## Is dirty?
  #
  # When no arguments passed, returns `true` or `false` depending on if there are
  # dirty objects in the store.
  #
  # Otherwise it returns `true` or `false` for the passed object. An object is dirty
  # if it has no `_syncedAt` attribute or if `updatedAt` is more recent than `_syncedAt`
  isDirty : (type, id) ->
    unless type
      return $.isEmptyObject @_dirty
      
    @_isDirty @cache(type, id)


  # ## Clear
  #
  # clears localStorage and cache
  # TODO: do not clear entire localStorage, clear only item that have been stored before
  clear : =>
    defer = @hoodie.defer()
  
    try
      @db.clear()
      @_cached = {}
      @clearChanged()
    
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
  isPersistent : ->
  
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
      
      obj.createdAt = new Date(Date.parse obj.createdAt) if obj.createdAt
      obj.updatedAt = new Date(Date.parse obj.updatedAt) if obj.updatedAt
      obj._syncedAt = new Date(Date.parse obj._syncedAt) if obj._syncedAt
      
      obj
    else
      false

  #
  _now : -> new Date

  # only lowercase letters, numbers and dashes are allowed for ids
  _isValidId : (key) ->
    /^[a-z0-9\-]+$/.test key
    
  # just like ids, but must start with a letter or a $ (internal types)
  _isValidType : (key) ->
    /^[a-z$][a-z0-9]+$/.test key
    
  _isSemanticId : (key) ->
    /^[a-z$][a-z0-9]+\/[a-z0-9]+$/.test key

  # cache of localStorage for quicker access
  _cached : {}

  # map of dirty objects by their ids
  _dirty : {}
  
  # is dirty?
  _isDirty : (object) ->
    
    return true  unless object._syncedAt  # no syncedAt? uuhh, that's dirty.
    return false unless object.updatedAt # no updatedAt? no dirt then
  
    object._syncedAt.getTime() < object.updatedAt.getTime()

  # marked as deleted?
  _isMarkedAsDeleted : (object) ->
    object._deleted is true

  # document key index
  #
  # TODO: make this cachy
  _index : ->
    @db.key(i) for i in [0...@db.length()]