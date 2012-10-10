# LocalStore
# ============

# window.localStrage wrapper and more
#
class Hoodie.LocalStore extends Hoodie.Store


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
  # * `$createdAt` unless it already exists
  # * `$updatedAt` every time
  # * `_$syncedAt`  if changes comes from remote
  #
  # example usage:
  #
  #     store.save('car', undefined, {color: 'red'})
  #     store.save('car', 'abc4567', {color: 'red'})
  save : (type, id, object, options = {}) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    # make sure we don't mess with the passed object directly
    object = $.extend {}, object
    
    # generate an id if necessary
    if id
      currentObject = @cache type, id
      isNew = typeof currentObject isnt 'object'
    else
      isNew = true
      id    = @uuid()

    # add createdBy hash to new objects
    # note: we check for `hoodie.my.account` as in some cases, the code
    #       might get executed before the account models is initiated.
    if isNew and @hoodie.my.account
      object.$createdBy or= @hoodie.my.account.ownerHash
   
    # handle public option
    object.$public = options.public if options.public? 
  
    # add timestamps
    if options.remote
      object._$syncedAt = @_now()

      unless isNew
        for key of currentObject
          if key.charAt(0) is '_' and object[key] is undefined
            object[key] = currentObject[key]

    else unless options.silent
      object.$updatedAt = @_now()
      object.$createdAt or= object.$updatedAt
  
    try 
      object = @cache type, id, object, options
      defer.resolve( object, isNew ).promise()

      @_trigger_change_events(object, options, isNew)

    catch error
      defer.reject(error).promise()
  
    return defer.promise()
  
  
  # find
  # ------

  # loads one object from Store, specified by `type` and `id`
  #
  # example usage:
  #
  #     store.find('car', 'abc4567')
  find : (type, id) ->
    defer = super
    return defer if @hoodie.isPromise(defer)
  
    try
      object = @cache type, id
    
      unless object
        return defer.reject( Hoodie.Errors.NOT_FOUND type, id ).promise()

      defer.resolve object
    catch error
      defer.reject error
    
    return defer.promise()
  
  
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
    return defer if @hoodie.isPromise(defer)

    keys = @_index()

    # normalize filter
    if typeof filter is 'string'
      type   = filter
      filter = (obj) -> obj.$type is type
  
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
  
  
  # Destroy
  # ---------

  # Destroys one object specified by `type` and `id`. 
  # 
  # when object has been synced before, mark it as deleted. 
  # Otherwise remove it from Store.
  destroy : (type, id, options = {}) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    object  = @cache type, id
    
    unless object
      return defer.reject(Hoodie.Errors.NOT_FOUND type, id).promise()
    
    if object._$syncedAt and not options.remote
      object._deleted = true
      @cache type, id, object
    
    else
      key = "#{type}/#{id}"
      @db.removeItem key
  
      @_cached[key] = false
      @clearChanged type, id

    # trigger events
    @trigger "destroy",                          object, options
    @trigger "destroy:#{type}",                  object, options
    @trigger "destroy:#{type}:#{id}",            object, options
    @trigger "change",                'destroy', object, options
    @trigger "change:#{type}",        'destroy', object, options
    @trigger "change:#{type}:#{id}",  'destroy', object, options
  
    defer.resolve($.extend {}, object).promise()
  
  
  # Cache
  # -------
  
  # loads an object specified by `type` and `id` only once from localStorage 
  # and caches it for faster future access. Updates cache when `value` is passed.
  #
  # Also checks if object needs to be synched (dirty) or not 
  #
  # Pass `options.remote = true` when object comes from remote
  cache : (type, id, object = false, options = {}) ->
    key = "#{type}/#{id}"
  
    if object
      @_cached[key] = $.extend object, { $type: type, id: id }
      @_setObject type, id, object
      
      if options.remote
        @clearChanged type, id 
        return $.extend {}, @_cached[key]
    
    else
      return $.extend {}, @_cached[key] if @_cached[key]?
      @_cached[key] = @_getObject type, id
    
    unless options.silent
      if @_cached[key] and (@_isDirty(@_cached[key]) or @_isMarkedAsDeleted(@_cached[key]))
        @markAsChanged type, id, @_cached[key]
      else
        @clearChanged type, id
    
    if @_cached[key]
      $.extend {}, @_cached[key]
    else
      @_cached[key]


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
  
    @hoodie.trigger 'store:dirty'
  
  
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
  markAsChanged : (type, id, object) ->
    key = "#{type}/#{id}"
    
    @_dirty[key] = object

    timeout = 2000 # 2 seconds timout before triggering the `store:idle` event
    window.clearTimeout @_dirtyTimeout
    @_dirtyTimeout = window.setTimeout ( =>
      @hoodie.trigger 'store:idle'
    ), timeout
    

  # changed docs
  # --------------

  # returns an Array of all dirty documents
  changedDocs : -> 
    for key, object of @_dirty
      [type, id]   = key.split '/'
      object.$type = type
      object.id    = id
      object
       

  # Is dirty?
  # ----------

  # When no arguments passed, returns `true` or `false` depending on if there are
  # dirty objects in the store.
  #
  # Otherwise it returns `true` or `false` for the passed object. An object is dirty
  # if it has no `_$syncedAt` attribute or if `updatedAt` is more recent than `_$syncedAt`
  isDirty : (type, id) ->
    unless type
      return $.isEmptyObject @_dirty
      
    @_isDirty @cache(type, id)


  # Clear
  # ------

  # clears localStorage and cache
  # TODO: do not clear entire localStorage, clear only item that have been stored before
  clear : =>
    defer = @hoodie.defer()
  
    try
      @db.clear()
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
  
  
  # UUID
  # ---------

  # helper to generate uuids.
  uuid : (len = 7) ->
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
    radix = chars.length
    (
      chars[ 0 | Math.random()*radix ] for i in [0...len]
    ).join('')


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

  
  # Private
  # ---------
  
  # more advanced localStorage wrappers to find/store objects
  _setObject : (type, id, object) ->
    key = "#{type}/#{id}"
    store = $.extend {}, object
    delete store.$type
    delete store.id
    @db.setItem key, JSON.stringify store
    
  _getObject : (type, id) ->
    key = "#{type}/#{id}"
    json = @db.getItem(key)
    if json
      obj = JSON.parse(json)
      obj.$type = type
      obj.id    = id
      
      obj.$createdAt = new Date(Date.parse obj.$createdAt) if obj.$createdAt
      obj.$updatedAt = new Date(Date.parse obj.$updatedAt) if obj.$updatedAt
      obj._$syncedAt = new Date(Date.parse obj._$syncedAt) if obj._$syncedAt
      
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
    
    return false unless object.$updatedAt # no updatedAt? no dirt then
    return true  unless object._$syncedAt # no syncedAt? uuhh, that's dirty.
  
    object._$syncedAt.getTime() < object.$updatedAt.getTime()

  # marked as deleted?
  _isMarkedAsDeleted : (object) ->
    object._deleted is true

  # document key index
  #
  # TODO: make this cachy
  _index : ->
    @db.key(i) for i in [0...@db.length()]

  # 
  _trigger_change_events: (object, options, isNew) ->
    if isNew
      @trigger "create",                           object, options
      @trigger "create:#{object.$type}",           object, options
      @trigger "change",                 'create', object, options
      @trigger "change:#{object.$type}", 'create', object, options
    else
      @trigger "update",                                        object, options
      @trigger "update:#{object.$type}",                        object, options
      @trigger "update:#{object.$type}:#{object.id}",           object, options
      @trigger "change",                              'update', object, options
      @trigger "change:#{object.$type}",              'update', object, options
      @trigger "change:#{object.$type}:#{object.id}", 'update', object, options