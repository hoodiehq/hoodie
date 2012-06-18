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
        @filters        = update.filters       if update.filters
        @_user_rev      = update._user_rev     if update._user_rev
                        
        @private        = true if @.invitees?
        @password     or= @id
        
      owner_uuid    : @owner_uuid()
      private       : @private  
      invitees      : @invitees  
      continuous    : @continuous  
      collaborative : @collaborative
      password      : @password
      filter        : @_turn_filters_into_function @filters
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
      
    
    # ## sync
    #
    # 1. get all docs from sharing db
    # 2. push local changes
    #
    # We need 1. in order to find out if there are documents that are
    # not to be shared anymore and therefore need to be removed.
      
      
      
    # ## Private
  
    #
    # get an array of hashes and turn into a stringified function
    #
    _turn_filters_into_function: (filters) ->
      return unless filters
    
      all_conditions = []
      for filter in filters
        current_condition = []
        for key, value of filter
        
          # no code injection, please
          continue if /'/.test "#{key}#{value}"
        
          if typeof value is 'string'
            current_condition.push "obj['#{key}'] == '#{value}'"
          else
            current_condition.push "obj['#{key}'] == #{value}"
          
        all_conditions.push current_condition.join " && "
      
      "function(obj) { return #{all_conditions.join " || "} }"