class Hoodie.Share.Instance extends Hoodie.RemoteStore

  # constructor
  # -------------
  
  # initializes a new share & returns a promise.
  #
  # ### Options
  #
  #     id:            (optional, defaults to random uuid)
  #                    name of share.
  #     objects:       (optional)
  #                    array of objects that should be shared
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
    
    @hoodie = @constructor.hoodie

    # setting attributes
    {id, access, continuous, password} = options
    @set {id, access, continuous, password}

    # if the current user isn't anonymous (has an account), a backend worker is 
    # used for the whole share magic, all we need to do is creating the $share 
    # doc and listen to its remote changes
    #
    # if the user is anonymous, we need to handle it manually. To achieve that
    # we use a customized hoodie, with its own socket
    @anonymous = @hoodie.my.account.username is undefined

    # use the custom Share Hoodie for users witouth an account
    if @anonymous
      @hoodie = new Hoodie.Share.Hoodie @hoodie, this 
  
  
  # set
  # -----
  
  # set an attribute, without making the change persistent yet.
  # alternatively, a hash of key/value pairs can be passed
  _memory: {}
  set : (key, value) =>
    if typeof key is 'object'
      @[_key] = @_memory[_key] = value for _key, value of key 
    else 
      @[key]  = @_memory[key]  = value

    # make sure share is private if invitees are set
    @private = @_memory.private = true if @invitees?.length

    return undefined
    
  
  # get
  # -----
  
  # get an attribute
  get : (key) =>
    @[key]
  
  
  # save
  # ------
  
  # make the made with `.set` persistent. An optional
  # key/value update can be passed as first argument
  save : (update = {}, options) ->
    defer = @hoodie.defer()

    @set(update) if update
    _handleUpdate = (properties, wasCreated) => 
      # reset memory
      @_memory = {}
      $.extend this, properties
      defer.resolve(this)

    # persist memory to store
    @hoodie.my.store.update("$share", @id, @_memory, options)
    .then _handleUpdate, defer.reject

    return defer.promise()
    
  
  # add
  # -----
  
  # add one or multiple objects to share. A promise that will
  # resolve with an array of objects can be passed as well.
  #
  # usage
  #
  # share.add(todoObject)
  # share.add([todoObject1, todoObject2, todoObject3])
  # share.add( hoodie.my.store.findAll (obj) -> obj.isShared )
  add: (objects) ->
    @toggle objects, true
    
      
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
  remove: (objects) -> 
    @toggle objects, false
  
  
  # toggle
  # --------

  # add or remove, depending on passed flag or current state
  toggle: (objects, doAdd) ->
    
    # normalize input
    unless @hoodie.isPromise(objects) or $.isArray(objects)
      objects = [objects]
    
    # get the update method to add/remove an object to/from share
    updateMethod = switch doAdd
      when true  then @_add
      when false then @_remove
      else @_toggle
    
    @hoodie.my.store.updateAll(objects, updateMethod)
    
  
  # sync
  # ------

  #
  # 1. find all objects that belong to share and that have local changes
  # 2. combine these with the docs that have been removed from the share
  # 3. sync all these with share's remote
  #
  sync: =>
    @save()
    .pipe @hoodie.my.store.findAll(@_isMySharedObjectAndChanged)
    .pipe (sharedObjectsThatChanged) =>
      @hoodie.my.remote.sync(sharedObjectsThatChanged)
      .then @_handleRemoteChanges


  # destroy
  # ---------

  # remove all objects from share, then destroy share itself
  destroy : =>
    @remove( @hoodie.my.store.findAll(@_isMySharedObject) )
    .then =>
      @hoodie.my.store.destroy("$share", @id)

      if @anonymous
        @hoodie.my.remote.disconnect()
        @hoodie.my.account.destroy()
  
  
  # hasAccount
  # ------------

  # returns true if either user or the share has a CouchDB account
  hasAccount: ->
    not @anonymous or @_userRev?
    
    
  # Private
  # ---------

  # _add
  #
  # returns a hash update to update the passed object
  # so that it gets added to the share
  _add: (obj) => 
    obj.$shares or= {}
    obj.$shares[@id] = true

    $shares: obj.$shares[@id]

  
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
      doAdd = ~obj.$shares.indexOf @id
    catch e
      doAdd = true

    if doAdd
      @_add(obj)
    else
      @_remove(obj)

  # all objects which $shares hash has share.id as key
  _isMySharedObject: (obj) =>
    obj.$shares?[@id]?
  
  # an object belongs to Share if it has the same id (its the actual share object)
  # or its $shares hash has share.id as key
  _isMySharedObjectAndChanged: (obj) =>
    belongsToMe = obj.id is @id or obj.$shares?[@id]?
    return belongsToMe and @hoodie.my.store.isDirty(obj.type, obj.id)

  #
  _handleRemoteChanges: ->
    console.log '_handleRemoteChanges', arguments...