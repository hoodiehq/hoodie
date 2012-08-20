class Hoodie.Share.Instance extends Hoodie.RemoteStore

  # ## constructor
  #
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
  #                    nobody but the creator and the invitees have access.
  #                    **true**
  #                    public sharing, read & write access
  #                    **{ read: true }**
  #                    public sharing, read only
  #                    **[user1, user2]**
  #                    only user1 & user2 have access
  #                    **{ read: [user1, user2] }**
  #                    only user1 & user2 have access (read only)
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
  #     # share all my documents that I marked as
  #     # shared and keep them updated
  #     hoodie.share.create
  #       continuous : true
  #       objects    : hoodie.my.store.findAll (obj) -> obj.isShared
  #
  constructor: (options = {}) ->
    
    @hoodie    = @constructor.hoodie

    # if the current user isn't anonymous (has an account), a backend worker is 
    # used for the whole share magic, all we need to do is creating the $share 
    # doc and listen to its remote changes
    #
    # if the user is anonymous, we need to handle it manually. To achieve that
    # we use a customized hoodie, with its own socket
    @anonymous = @hoodie.my.account.username is undefined
    
    # setting attributes
    @set options

    # also make sure we have an ownerUuid in order to differentiate between my 
    # shares and the shares by others
    @_assureOwnerUuid() 
    
    # use the custom Share Hoodie for users witouth an account
    @hoodie = new Hoodie.Share.Hoodie @hoodie, this if @anonymous
  
  
  # ## set
  #
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
    
  
  # ## get
  #
  # get an attribute
  get : (key) =>
    @[key]
  
  
  # ## save
  #
  # attributes getter & setter. It always returns all properties that
  # are actual attributes of the share object that gets stored.
  #
  # But beware of other data that gets stored with the share object,
  # coming from the custom config module
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
    
  
  # ## add
  #
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
    
      
  # ## remove
  #
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
  
  
  # ## toggle ()
  #
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
    
  
  # ## sync
  #
  # loads all local documents that belong to share and sync them.
  # Before the first execution, we make sure that an account exist.
  #
  # The logic of the actual sync is in the private _sync method
  sync: =>
      
    # when user has an account, we're good to go.
    if @hasAccount()
      
      # sync now and make it the default behavior from now on
      do @sync = @_sync
      
    # otherwise we need to create the share db manually,
    # by signing up as a user with the neame of the share db.
    else
      
      @hoodie.my.account.signUp( "share/#{@id}", @password )
      .done (username, response) =>
        
        # remember that we signed up successfully for the future
        @save _userRev: @hoodie.my.account._doc._rev
        
        # finally: start the sync and make it the default behavior
        # from now on
        do @sync = @_sync
  
  
  # ## hasAccount
  #
  # returns true if either user or the share has a CouchDB account
  hasAccount: ->
    not @anonymous or @_userRev?
    
    
  # ## Private

  # owner uuid
  #
  # in order to differentiate between my shares and shares by others,
  # each account gets a uuid assigned that will be stored with every $share doc.
  #
  # at the moment we store the ownerUuid with the $config/hoodie config. Not sure
  # if that's the right place for it, but it works.
  #
  # Another possibility would be to assign a uuid to each user on sign up and use 
  # this uuid here, but this has not yet been discussed.
  _assureOwnerUuid : ->
    return if @ownerUuid

    config      = @constructor.hoodie.my.config
    @ownerUuid = config.get('share.ownerUuid')

    # if this is the very first share, we generate and store an ownerUuid
    unless @ownerUuid
      @ownerUuid = @constructor.hoodie.my.store.uuid()
      config.set 'share.ownerUuid', @ownerUuid


  # returns a hash update to update the passed object
  # so that it gets added to the share
  _add: (obj) => 
    newValue = if obj.$shares
      obj.$shares.concat @id unless ~obj.$shares.indexOf(@id)
    else
      [@id]

    if newValue
      delete @$docsToRemove["#{obj.type}/#{obj.id}"]
      @set '$docsToRemove', @$docsToRemove 

    $shares: newValue

  
  # returns a hash update to update the passed object
  # so that it gets removed from the current share
  #
  # on top of that, the object gets stored in the $docsToRemove
  # property. These will removed from the share database on next sync
  $docsToRemove: {}
  _remove : (obj) =>
    try
      $shares = obj.$shares
      
      if ~(idx = $shares.indexOf @id)
        $shares.splice(idx, 1) 

        # TODO:
        # when anonymous, use $docsToRemove and push the deletion
        # manually, so that the _rev stamps do get updated.
        # When user signes up, rename the attribut to $docsToRemove,
        # so that the worker can take over
        #
        # Alternative: find a way to create a new revions locally.
        @$docsToRemove["#{obj.type}/#{obj.id}"] = _rev: obj._rev
        @set '$docsToRemove', @$docsToRemove

        $shares: if $shares.length then $shares else undefined
      


  # depending on whether the passed object belongs to the
  # share or not, an update will be returned to add/remove 
  # it to/from share
  _toggle : => 
    try
      doAdd = ~obj.$shares.indexOf @id
    catch e
      doAdd = true

    if doAdd
      @_add(obj)
    else
      @_remove(obj)


  #
  # 1. find all objects that belong to share and that have local changes
  # 2. combine these with the docs that have been removed from the share
  # 3. sync all these with share's remote
  #
  _sync : =>
    @save()
    .pipe @hoodie.my.store.findAll(@_isMySharedObjectAndChanged)
    .pipe (sharedObjectThatChanged) =>
      @hoodie.my.remote.sync(sharedObjectThatChanged)
      .then @_handleRemoteChanges


  # I appologize for this mess of code. Yes, you're right. ~gr2m
  _isMySharedObjectAndChanged: (obj) =>
    belongsToMe = obj.id is @id or obj.$shares and ~obj.$shares.indexOf(@id)
    return belongsToMe and @hoodie.my.store.isDirty(obj.type, obj.id)

  #
  _handleRemoteChanges: ->
    console.log '_handleRemoteChanges', arguments...