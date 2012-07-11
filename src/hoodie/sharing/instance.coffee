class Hoodie.Sharing.Instance

  #
  constructor: (options = {}) ->
    
    @hoodie    = @constructor.hoodie

    # if the current user isn't anonymous (has an account), a backend worker is 
    # used for the whole sharing magic, all we need to do is creating the $sharing 
    # doc and listen to its remote changes
    #
    # if the user is anonymous, we need to handle it manually. To achieve that
    # we use a customized hoodie, with its own socket
    @anonymous = @hoodie.account.username is undefined
    
    # setting attributes
    @set options

    # also make sure we have an owner_uuid in oredr to differentiate between my 
    # sharings and the sharings by others
    @_assure_owner_uuid() 
    
    # use the custom Sharing Hoodie for users witouth an account
    @hoodie = new Hoodie.Sharing.Hoodie @hoodie, this if @anonymous
  
  
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

    # make sure sharing is private if invitees are set
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
  # are actual attributes of the sharing object that gets stored.
  #
  # But beware of other data that gets stored with the sharing object,
  # coming from the custom config module
  save : (update = {}, options) ->
    defer = @hoodie.defer()

    @set(update) if update
    _handle_update = (properties, was_created) => 
      # reset memory
      @_memory = {}
      $.extend this, properties
      defer.resolve(this)

    # persist memory to store
    @hoodie.store.update("$sharing", @id, @_memory, options)
    .then _handle_update, defer.reject

    return defer.promise()
    
  
  # ## add
  #
  # add one or multiple objects to sharing. A promise that will
  # resolve with an array of objects can be passed as well.
  #
  # usage
  #
  # sharing.add(todo_object)
  # sharing.add([todo_object1, todo_object2, todo_object3])
  # sharing.add( hoodie.store.findAll (obj) -> obj.is_shared )
  add: (objects) ->
    @toggle objects, true
    
      
  # ## remove
  #
  # remove one or multiple objects from sharing. A promise that will
  # resolve with an array of objects can be passed as well.
  #
  # usage
  #
  # sharing.remove(todo_object)
  # sharing.remove([todo_object1, todo_object2, todo_object3])
  # sharing.remove( hoodie.store.findAll (obj) -> obj.is_shared )
  remove: (objects) -> 
    @toggle objects, false
  
  
  # ## toggle ()
  #
  # add or remove, depending on passed flag or current state
  toggle: (objects, do_add) ->
    
    # normalize input
    unless @hoodie.isPromise(objects) or $.isArray(objects)
      objects = [objects]
    
    # get the update method to add/remove an object to/from sharing
    update_method = switch do_add
      when true  then @_add
      when false then @_remove
      else @_toggle
    
    @hoodie.store.updateAll(objects, update_method)
    
  
  # ## sync
  #
  # loads all local documents that belong to sharing and sync them.
  # Before the first execution, we make sure that an account exist.
  #
  # The logic of the actual sync is in the private _sync method
  sync: =>
      
    # when user has an account, we're good to go.
    if @hasAccount()
      
      # sync now and make it the default behavior from now on
      do @sync = @_sync
      
    # otherwise we need to create the sharing db manually,
    # by signing up as a user with the neame of the sharing db.
    else
      
      @hoodie.account.sign_up( "sharing/#{@id}", @password )
      .done (username, response) =>
        
        # remember that we signed up successfully for the future
        @save _user_rev: @hoodie.account._doc._rev
        
        # finally: start the sync and make it the default behavior
        # from now on
        do @sync = @_sync
  
  
  # ## hasAccount
  #
  # returns true if either user or the sharing has a couchDB account
  hasAccount: ->
    not @anonymous or @_user_rev?
    
    
  # ## Private

  # owner uuid
  #
  # in order to differentiate between my sharings and sharings by others,
  # each account gets a uuid assigned that will be stored with every $sharing doc.
  #
  # at the moment we store the owner_uuid with the $config/hoodie config. Not sure
  # if that's the right place for it, but it works.
  #
  # Another possibility would be to assign a uuid to each user on sign up and use 
  # this uuid here, but this has not yet been discussed.
  _assure_owner_uuid : ->
    return if @owner_uuid

    config      = @constructor.hoodie.config
    @owner_uuid = config.get('sharing.owner_uuid')

    # if this is the very first sharing, we generate and store an owner_uuid
    unless @owner_uuid
      @owner_uuid = @constructor.hoodie.store.uuid()
      config.set 'sharing.owner_uuid', @owner_uuid

  # I appologize for this mess of code ~gr2m
  _is_my_shared_object_and_changed: (obj) =>
    belongs_to_me = obj.id is @id or obj.$sharings and ~obj.$sharings.indexOf(@id)
    return belongs_to_me and @hoodie.store.is_dirty(obj.type, obj.id)


  # returns a hash update to update the passed object
  # so that it gets added to the sharing
  _add: (obj) => 
    new_value = if obj.$sharings
      obj.$sharings.concat @id unless ~obj.$sharings.indexOf(@id)
    else
      [@id]

    if new_value
      delete @$docs_to_remove["#{obj.type}/#{obj.id}"]
      @set '$docs_to_remove', @$docs_to_remove 

    $sharings: new_value

  
  # returns a hash update to update the passed object
  # so that it gets removed from the current sharing
  #
  # on top of that, the object gets stored in the $docs_to_remove
  # property. These will removed from the sharing database on next sync
  $docs_to_remove: {}
  _remove : (obj) =>
    try
      $sharings = obj.$sharings
      
      if ~(idx = $sharings.indexOf @id)
        $sharings.splice(idx, 1) 

        # TODO:
        # when anonymous, use $docs_to_remove and push the deletion
        # manually, so that the _rev stamps do get updated.
        # When user signes up, rename the attribut to $docs_to_remove,
        # so that the worker can take over
        #
        # Alternative: find a way to create a new revions locally.
        @$docs_to_remove["#{obj.type}/#{obj.id}"] = _rev: obj._rev
        @set '$docs_to_remove', @$docs_to_remove

        $sharings: if $sharings.length then $sharings else undefined
      


  # depending on whether the passed object belongs to the
  # sharing or not, an update will be returned to add/remove 
  # it to/from sharing
  _toggle : => 
    try
      do_add = ~obj.$sharings.indexOf @id
    catch e
      do_add = true

    if do_add
      @_add(obj)
    else
      @_remove(obj)


  #
  # 1. load all objects that belong to sharing and that have local changes
  # 2. combine these with the docs that have been removed from the sharing
  # 3. sync all these with sharing's remote
  #
  _sync : =>
    @save()
    .pipe @hoodie.store.loadAll(@_is_my_shared_object_and_changed)
    .pipe (shared_object_that_changed) =>
      @hoodie.remote.sync(shared_object_that_changed)
      .then @_handle_remote_changes

  #
  _handle_remote_changes: ->
    console.log '_handle_remote_changes', arguments...