define 'hoodie/sharing/instance', ['hoodie/config', 'hoodie/sharing/hoodie'], (Config, SharingHoodie) ->

  class SharingInstance

    # ## clas methods
    
    # will be set by HoodieSharing.constructor
    @hoodie: null
    
    # 
    @create: (options) ->
      sharing = new this options
      sharing.create()
    
    @load: (id) ->
      @hoodie.store.load('$sharing', id).pipe (obj) =>
        new this obj
    
    # 
    @destroy: (id) ->
      @load(id).pipe (obj) =>
        sharing = new this obj
        sharing.destroy()

    # if the current user isn't anonymous (has an account), a backend worker is 
    # used for the whole sharing magic, all we need to do is creating the $sharing 
    # doc and listen to its remote changes
    #
    # if the user is anonymous, we need to handle it manually. To achieve that
    # we use a customized hoodie, with its own socket
    anonymous: undefined
      
    #
    constructor: (attributes = {}) ->
      
      @hoodie    = @constructor.hoodie
      @anonymous = @hoodie.account.username is undefined
      
      # make sure we have an id, as we need it for the config
      @id        = attributes.id or @hoodie.store.uuid(7)
      
      # setting attributes
      @attributes attributes
      
      # use the $sharing doc directly for configuration settings
      @config = new Config @hoodie, type: '$sharing', id: @id
      
      # if objects passed, add them to the sharing
      @add attributes.objects if attributes.objects

      if @anonymous
        @hoodie = new SharingHoodie @hoodie, this
        
        # unbind remote from starting to sync on sign up
        # unless the sharing is set to be continuous
        #
        # if sharing is not continuous, pull & push happens manually
        unless @continuous
          @hoodie.unbind 'account:signed_in',  @hoodie.remote.connect
          @hoodie.unbind 'account:signed_out', @hoodie.remote.disconnect
        
    
    # ## owner uuid
    #
    # in order to differentiate between my sharings and sharings by others,
    # each account gets a uuid assigned that will be stored with every $sharing doc.
    #
    # at the moment we store the owner_uuid with the $config/hoodie config. Not sure
    # if that's the right place, but it works.
    #
    owner_uuid : ->
      config = @constructor.hoodie.config
      config.get('sharing.owner_uuid') or config.set 'sharing.owner_uuid', @constructor.hoodie.store.uuid()
    
    
    # ## attributes
    #
    # attributes getter & setter
    attributes: (update) ->
      
      if update
        @private        = update.private       if update.private  
        @invitees       = update.invitees      if update.invitees  
        @continuous     = update.continuous    if update.continuous  
        @collaborative  = update.collaborative if update.collaborative
        @password       = update.password      if update.password
        @_user_rev      = update._user_rev     if update._user_rev
                        
        @private        = true if @.invitees?
        @password     or= @id
        
      owner_uuid    : @owner_uuid()
      private       : @private  
      invitees      : @invitees  
      continuous    : @continuous  
      collaborative : @collaborative
      password      : @password
      _user_rev     : @_user_rev
      
    
    # ## create
    #
    # creates a new $sharing doc.
    create: ->
      defer = @hoodie.defer()
      
      @hoodie.store.save( "$sharing", @id, @attributes() )
      
      # when anonymous, we need to create the sharing db manually,
      # by signing up as a user with the neame of the sharing db.
      if @anonymous
        @hoodie.account.sign_up( "sharing/#{@id}", @password )
        
        # remember that we signed up successfully
        .done (username, response) =>
          @_user_rev = response.rev
          @config.set '_user_rev', @_user_rev
          defer.resolve(this)
        
        # TODO: better error handling
        .fail (error) =>
          defer.reject error
          if error.error is 'conflict'
            alert "sharing/#{@id} has been shared before"
            
      else
        @hoodie.one "remote:updated:$sharing:#{@id}", defer.resolve
      
      defer.promise()
      
    
    # ## add
    #
    # add one or multiple objects to sharing
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
    # remove one or multiple objects from sharing
    #
    # usage
    #
    # sharing.remove(todo_object)
    # sharing.remove([todo_object1, todo_object2, todo_object3])
    # sharing.remove( hoodie.store.findAll (obj) -> obj.is_shared )
    remove: (objects) -> 
      @toggle objects, false
    
    
    # ## toggle (add or remove, depending on passed flag)
    #
    # if do_add is true, add the passed objects to sharing, otherwise
    # remove them
    toggle: (objects, do_add) ->
      
      # normalize input
      unless @hoodie.isPromise objects
        objects = [objects] unless $.isArray objects
        
      update = switch do_add
      
        # add objects to sharing
        when true
          (obj) => 
            obj.$sharings or= []
            obj.$sharings.push @id
            
        # remove objects to sharing
        when false
          (obj) =>
            try
              idx = obj.$sharings.indexOf @id
              obj.$sharings.splice idx, 1 if ~idx
        
        # add/remove depending on current state of object
        else
          (obj) => 
            idx = -1
            try
              idx = obj.$sharings.indexOf @id
            
            if ~idx  # returns false for -1
              obj.$sharings.splice idx, 1
            else
              obj.$sharings or= []
              obj.$sharings.push @id
      
      @hoodie.store.updateAll objects, update
      
    
    # ## sync
    #
    # 1. get all docs from sharing db
    # 2. push local changes
    #
    # We need 1. in order to find out if there are documents that are
    # not shared anymore and therefore need to be removed.
    sync: ->
      @hoodie.store.loadAll(@_is_my_shared_object_and_changed)
      .pipe @hoodie.remote.sync
      
    # ## Private
  
    _is_my_shared_object_and_changed: (obj) =>
      obj.$sharings and ~obj.$sharings.indexOf(@id) and @hoodie.store.is_dirty(obj.type, obj.id)