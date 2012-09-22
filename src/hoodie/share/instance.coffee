class Hoodie.Share.Instance extends Hoodie.RemoteStore
  
  # default values
  # ----------------

  # shares are not accessible to others by default.
  access: false


  # constructor
  # -------------
  
  # initializes a new share & returns a promise.
  #
  # ### Options
  #
  #     id:            (optional, defaults to random uuid)
  #                    name of share.
  #     access:        (default: false)
  #                    **false**
  #                    only the creator has access.
  #                    **true**
  #                    public sharing, read & write access
  #                    **{ read: true }**
  #                    public sharing, read only
  #                    **[user1, user2]**
  #                    only user1 & user2 have access
  #                    **{ read: [user1, user2] }**
  #                    only user1 & user2 have access (read only)
  #                    **{ read: true, write: [user1, user2] }**
  #                    public sharing, but only user1 & user 2 can edit
  #     continuous:    (default: false)
  #                    if set to true, the shared objects will be
  #                    continuously updated.
  #     password:      (optional)
  #                    a sharing can be optionally protected with a password.
  #
  # Examples
  #
  # 
  #     # share my todo list with Joey and Frank
  #     hoodie.share.create
  #       access : [
  #         "joey@example.com"
  #         "frank@example.com"
  #       ]
  #       objects : [
  #         todoList, todo1, todo2, todo3
  #       ]
  #
  constructor: (options = {}) ->

    @set options
    @id = options.id or @hoodie.my.store.uuid()
  
  
  # set
  # -----
  
  # set an attribute, without making the change persistent yet.
  # alternatively, a hash of key/value pairs can be passed
  _memory: {}
  _allowed_options: ["access", "continuous", "password"]
  set : (key, value) =>
    if typeof key is 'object'
      for _key, value of key when _key in @_allowed_options
        @[_key] = @_memory[_key] = value 
    else 
      @[key]  = @_memory[key]  = value if key in @_allowed_options

    return undefined
    
  
  # get
  # -----
  
  # get an attribute
  get : (key) =>
    @[key]
  
  
  # save
  # ------
  
  # make changes made with `.set` persistent. An optional
  # key/value update can be passed as first argument
  #
  # Obviously, sharing object only works if my local data
  # gets synchronized. To make this happen for users without
  # an account, we do an anonymous signUp.
  save : (update = {}, options) ->
    
    unless @hoodie.my.account.hasAccount()
      @hoodie.my.account.anonymousSignUp()

    @set(update) if update
    _handleUpdate = (properties, wasCreated) => 
      # reset memory
      @_memory = {}
      $.extend this, properties
      return this

    # persist memory to store
    @hoodie.my.store.update("$share", @id, @_memory, options)
    .pipe(_handleUpdate)
    
  
  # add
  # -----
  
  # add one or multiple objects to share. A promise that will
  # resolve with an array of objects can be passed as well.
  #
  # usage
  #
  # share.add(todoObject)
  # share.add([todoObject1, todoObject2, todoObject3])
  # share.add([todoObject1, todoObject2, todoObject3], ["name", "city"])
  # share.add( hoodie.my.store.findAll (obj) -> obj.isShared )
  add : (objects, sharedAttributes = true) ->
    @toggle objects, sharedAttributes
    
      
  # remove
  # --------
  
  # remove one or multiple objects from share. A promise that will
  # resolve with an array of objects can be passed as well.
  #
  # usage
  #
  # share.remove(todoObject)
  # share.remove([todoObject1, todoObject2, todoObject3])
  # share.remove( hoodie.my.store.findAll (obj) -> obj.isShared )
  remove : (objects) -> 
    @toggle objects, false
  
  
  # toggle
  # --------

  # add or remove, depending on passed flag or current state
  toggle : (objects, filter) ->
    
    # normalize input
    unless @hoodie.isPromise(objects) or $.isArray(objects)
      objects = [objects]
    
    # get the update method to add/remove an object to/from share
    updateMethod = switch filter
      when undefined  then @_toggle
      when false      then @_remove
      else @_add(filter)
    
    @hoodie.my.store.updateAll(objects, updateMethod)
    
  
  # sync
  # ------

  #
  # 1. find all objects that belong to share and that have local changes
  # 2. combine these with the docs that have been removed from the share
  # 3. sync all these with share's remote
  #
  sync : =>
    @save()
    .pipe(@findAllObjects)
    .pipe(@hoodie.my.remote.sync)


  # destroy
  # ---------

  # remove all objects from share, then destroy share itself
  destroy : =>
    @remove( @findAllObjects() )
    .then =>
      @hoodie.my.store.destroy("$share", @id)
    
  
  # findAllObjects
  # ----------------

  #
  findAllObjects : =>
    @hoodie.my.store.findAll(@_isMySharedObjectAndChanged)


  # Private
  # ---------

  
  # _add
  #
  # returns another function that will update a object
  # to be shared based on the passed filter
  _add : (filter) =>
    return (obj) => 
      obj.$shares or= {}
      obj.$shares[@id] = filter

      $shares: obj.$shares

  # _remove
  #
  # returns a hash update to update the passed object
  # so that it gets removed from the current share 
  _remove : (obj) =>
    return {} unless obj.$shares

    delete obj.$shares[@id]
    obj.$shares = undefined if $.isEmptyObject obj.$shares
    $shares: obj.$shares
      

  # depending on whether the passed object belongs to the
  # share or not, an update will be returned to add/remove 
  # it to/from share
  _toggle : (obj) => 
    try
      doAdd = obj.$shares[@id] is undefined or obj.$shares[@id] is false
    catch e
      doAdd = true

    if doAdd
      @_add(true)(obj)
    else
      @_remove(obj)

  # all objects which $shares hash has share.id as key
  _isMySharedObject : (obj) =>
    obj.$shares?[@id]?

  # an object belongs to Share if it has the same id (its the actual share object)
  # or its $shares hash has share.id as key
  _isMySharedObjectAndChanged : (obj) =>
    belongsToMe = obj.id is @id or obj.$shares?[@id]?
    return belongsToMe and @hoodie.my.store.isDirty(obj.$type, obj.id)

  #
  _handleRemoteChanges : ->
    console.log '_handleRemoteChanges', arguments...