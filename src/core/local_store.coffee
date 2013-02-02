# LocalStore
# ============

# window.localStrage wrapper and more
#
class Hoodie.LocalStore extends Hoodie.Store

  # Properties
  # ---------

  # 2 seconds timout before triggering the `store:idle` event
  idleTimeout : 2000


  # Constructor
  # ---------

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
        length     : 0
        clear      : -> null
    
    # handle sign outs
    @hoodie.on 'account:signout', @clear
    @hoodie.on 'account:signup', @markAllAsChanged

    # provide reference to hoodie in all promises
    @_promiseApi.hoodie = @hoodie

    @_bootstrap()
    
  
  # localStorage proxy
  db : 
    getItem    : (key)         -> window.localStorage.getItem(key)
    setItem    : (key, value)  -> window.localStorage.setItem key, value
    removeItem : (key)         -> window.localStorage.removeItem(key)
    key        : (nr)          -> window.localStorage.key(nr)    
    length     : ()            -> window.localStorage.length
    clear      : ()            -> window.localStorage.clear()


  # Save
  # ------

  # saves the passed object into the store and replaces an eventually existing 
  # document with same type & id.
  #
  # When id is undefined, it gets generated an new object gets saved 
  #
  # It also adds timestamps along the way:
  # 
  # * `createdAt` unless it already exists
  # * `updatedAt` every time
  # * `_syncedAt`  if changes comes from remote
  #
  # example usage:
  #
  #     store.save('car', undefined, {color: 'red'})
  #     store.save('car', 'abc4567', {color: 'red'})
  save : (type, id, properties, options = {}) ->
    defer = super
    return @_decoratePromise(defer) if @hoodie.isPromise(defer)

    # make sure we don't mess with the passed object directly
    object = $.extend true, {}, properties
    
    # generate an id if necessary
    if id
      currentObject = @cache type, id
      isNew = typeof currentObject isnt 'object'
    else
      isNew = true
      id    = @hoodie.uuid()

    # add createdBy hash to new objects
    # note: we check for `hoodie.account` as in some cases, the code
    #       might get executed before the account module is initiated.
    # todo: move ownerHash into a method on the core hoodie module
    if isNew and @hoodie.account
      object.createdBy or= @hoodie.account.ownerHash

    # handle local properties and hidden properties with $ prefix
    # keep local properties for remote updates
    unless isNew

      # for remote updates, keep local properties (starting with '_')
      # for local updates, keep hidden properties (starting with '$')
      for key of currentObject when not object.hasOwnProperty key
        switch key.charAt(0)
          when '_'
            object[key] = currentObject[key] if options.remote
          when '$'
            object[key] = currentObject[key] unless options.remote
  
    # add timestamps
    if options.remote
      object._syncedAt = @_now()

    else unless options.silent
      object.updatedAt = @_now()
      object.createdAt or= object.updatedAt
  
    try 
      object = @cache type, id, object, options
      defer.resolve( object, isNew ).promise()

      event = if isNew then 'add' else 'update'
      @_triggerEvents(event, object, options)

    catch error
      defer.reject(error).promise()
  
    return @_decoratePromise defer.promise()
  
  
  # find
  # ------

  # loads one object from Store, specified by `type` and `id`
  #
  # example usage:
  #
  #     store.find('car', 'abc4567')
  find : (type, id) ->
    defer = super
    return @_decoratePromise(defer) if @hoodie.isPromise(defer)
  
    try
      object = @cache type, id
    
      unless object
        defer.reject( Hoodie.Errors.NOT_FOUND type, id ).promise()

      defer.resolve object
    catch error
      defer.reject error
    
    return @_decoratePromise defer.promise()
  
  
  # findAll
  # ---------

  # returns all objects from store. 
  # Can be optionally filtered by a type or a function
  #
  # example usage:
  #
  #     store.findAll()
  #     store.findAll('car')
  #     store.findAll(function(obj) { return obj.brand == 'Tesla' })
  findAll : (filter = -> true) ->
    defer = super
    return @_decoratePromise(defer) if @hoodie.isPromise(defer)

    keys = @_index()

    # normalize filter
    if typeof filter is 'string'
      type   = filter
      filter = (obj) -> obj.type is type
  
    try
      # coffeescript gathers the result of the respective for key in keys loops
      # and returns it as array, which will be stored in the results variable
      results = for key in keys when @_isSemanticId key
        [currentType, id] = key.split '/'
        
        obj = @cache currentType, id
        if obj and filter(obj)
          obj
        else
          continue

      defer.resolve(results).promise()
    catch error
      defer.reject(error).promise()
  
    return @_decoratePromise defer.promise()
  
  
  # Destroy
  # ---------

  # Destroys one object specified by `type` and `id`. 
  # 
  # when object has been synced before, mark it as deleted. 
  # Otherwise remove it from Store.
  remove : (type, id, options = {}) ->
    defer = super
    return @_decoratePromise(defer) if @hoodie.isPromise(defer)

    object  = @cache type, id
    
    unless object
      return @_decoratePromise defer.reject(Hoodie.Errors.NOT_FOUND type, id).promise()
    
    if object._syncedAt and not options.remote
      object._deleted = true
      @cache type, id, object
    
    else
      key = "#{type}/#{id}"
      @db.removeItem key
  
      @_cached[key] = false
      @clearChanged type, id

    @_triggerEvents "remove", object, options
    promise = defer.resolve(object).promise()
    @_decoratePromise promise
    

  # update / updateAll / removeAll
  # --------------------------------

  # just decorating returned promises
  update : -> @_decoratePromise super
  updateAll : -> @_decoratePromise super
  removeAll : -> @_decoratePromise super

  
  
  # Cache
  # -------
  
  # loads an object specified by `type` and `id` only once from localStorage 
  # and caches it for faster future access. Updates cache when `value` is passed.
  #
  # Also checks if object needs to be synched (dirty) or not 
  #
  # Pass `options.remote = true` when object comes from remote
  # Pass 'options.silent = true' to avoid events from being triggered.
  cache : (type, id, object = false, options = {}) ->
    key = "#{type}/#{id}"
  
    if object
      $.extend object, { type: type, id: id }
      @_setObject type, id, object
      
      if options.remote
        @clearChanged type, id 

        @_cached[key] = $.extend true, {}, object
        return @_cached[key]

    else 

      # if the cached key returns false, it means
      # that we have removed that key. We just 
      # set it to false for performance reasons, so
      # that we don't need to look it up again in localStorage
      if @_cached[key] is false
        return false 

      # if key is cached, return it. But make sure
      # to make a deep copy beforehand (=> true)
      if @_cached[key]
        return $.extend true, {}, @_cached[key] 

      # if object is not yet cached, load it from localStore
      object = @_getObject type, id
    
      # stop here if object did not exist in localStore
      # and cache it so we don't need to look it up again
      if object is false
        @clearChanged type, id
        @_cached[key] = false
        return false

    if @_isMarkedAsDeleted object
      @markAsChanged type, id, object, options
      @_cached[key] = false
      return false

    # here is where we cache the object for
    # future quick access
    @_cached[key] = $.extend true, {}, object

    if @_isDirty(object)
      @markAsChanged type, id, @_cached[key], options
    else
      @clearChanged type, id
    
    return $.extend true, {}, object


  # Clear changed 
  # ---------------

  # removes an object from the list of objects that are flagged to by synched (dirty)
  # and triggers a `store:dirty` event
  clearChanged : (type, id) ->
  
    if type and id
      key = "#{type}/#{id}"
      delete @_dirty[key]
    else
      @_dirty = {}

    @_saveDirtyIds()
    window.clearTimeout @_dirtyTimeout
  
  
  # Marked as deleted?
  # --------------------

  # when an object gets deleted that has been synched before (`_rev` attribute),
  # it cannot be removed from store but gets a `_deleted: true` attribute
  isMarkedAsDeleted : (type, id) ->
    @_isMarkedAsDeleted @cache(type, id)
      
  
  # ## Mark as changed
  # --------------------

  # Marks object as changed (dirty). Triggers a `store:dirty` event immediately and a 
  # `store:idle` event once there is no change within 2 seconds
  markAsChanged : (type, id, object, options = {}) ->
    key = "#{type}/#{id}"
    
    @_dirty[key] = object
    @_saveDirtyIds()

    return if options.silent

    @_trigger_dirty_and_idle_events()


  # ## Mark all as changed
  # ------------------------

  # Marks all local object as changed (dirty) to make them sync
  # with remote
  markAllAsChanged : =>
    @findAll().pipe (objects) =>

      for object in objects
        key = "#{object.type}/#{object.id}"
        @_dirty[key] = object

      @_saveDirtyIds()
      @_trigger_dirty_and_idle_events()


  # changed docs
  # --------------

  # returns an Array of all dirty documents
  changedDocs : -> 
    for key, object of @_dirty
      [type, id]   = key.split '/'
      object.type = type
      object.id    = id
      object
       

  # Is dirty?
  # ----------

  # When no arguments passed, returns `true` or `false` depending on if there are
  # dirty objects in the store.
  #
  # Otherwise it returns `true` or `false` for the passed object. An object is dirty
  # if it has no `_syncedAt` attribute or if `updatedAt` is more recent than `_syncedAt`
  isDirty : (type, id) ->
    unless type
      return $.isEmptyObject @_dirty
      
    @_isDirty @cache(type, id)


  # Clear
  # ------

  # clears localStorage and cache
  # TODO: do not clear entire localStorage, clear only the items that have been stored
  #       using `hoodie.store` before.
  clear : =>
    defer = @hoodie.defer()
  
    try
      keys = @_index()
      results = for key in keys when @_isSemanticId key
        @db.removeItem key

      @_cached = {}
      @clearChanged()
    
      defer.resolve()

      @trigger "clear"
    catch error
      defer.reject(error)
    
    return defer.promise()
  

  # Is persistant?
  # ----------------

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


  # trigger
  # ---------

  # proxies to hoodie.trigger
  trigger : (event, parameters...) ->
    @hoodie.trigger "store:#{event}", parameters...

  # on
  # ---------

  # proxies to hoodie.on
  on : (event, data) ->
    event = event.replace /(^| )([^ ]+)/g, "$1store:$2"
    @hoodie.on event, data


  # extend
  # --------

  # extend promises returned by store.api
  decoratePromises : ( methods ) ->
    $.extend @_promiseApi, methods

  
  # Private
  # ---------

  # initial bootstrap of all dirty objects stored in localStorage
  _bootstrap : ->
    keys = @db.getItem '_dirty'
    return unless keys
    for key in keys
      [type, id] = key.split '/'
      obj = @cache type, id

  
  # more advanced localStorage wrappers to find/store objects
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
      obj.type = type
      obj.id    = id
      
      obj.createdAt = new Date(Date.parse obj.createdAt) if obj.createdAt
      obj.updatedAt = new Date(Date.parse obj.updatedAt) if obj.updatedAt
      obj._syncedAt = new Date(Date.parse obj._syncedAt) if obj._syncedAt
      
      obj
    else
      false

  # store IDs of dirty objects
  _saveDirtyIds : ->
    if $.isEmptyObject @_dirty
      @db.removeItem '_dirty'
    else
      ids = Object.keys(@_dirty)
      @db.setItem '_dirty', ids.join(',')

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
    
    return false unless object.updatedAt # no updatedAt? no dirt then
    return true  unless object._syncedAt # no syncedAt? uuhh, that's dirty.
  
    object._syncedAt.getTime() < object.updatedAt.getTime()

  # marked as deleted?
  _isMarkedAsDeleted : (object) ->
    object._deleted is true

  # document key index
  #
  # TODO: make this cachy
  _index : ->
    @db.key(i) for i in [0...@db.length()]

  # 
  _triggerEvents: (event, object, options) ->
    
    @trigger event,                                           object, options
    @trigger "#{event}:#{object.type}",                      object, options
    @trigger "#{event}:#{object.type}:#{object.id}",         object, options unless event is 'new'
    @trigger "change",                                 event, object, options
    @trigger "change:#{object.type}",                 event, object, options
    @trigger "change:#{object.type}:#{object.id}",    event, object, options unless event is 'new'

  #
  _trigger_dirty_and_idle_events: ->
    @trigger 'dirty'
    window.clearTimeout @_dirtyTimeout
    @_dirtyTimeout = window.setTimeout ( =>
      @trigger 'idle'
    ), @idleTimeout
  
  # extend this property with extra functions that will be available
  # on all promises returned by hoodie.store API
  _promiseApi : {}

  #
  _decoratePromise : (promise) ->
    $.extend promise, @_promiseApi