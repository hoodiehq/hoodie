define 'hoodie/sharing/instance', ['hoodie/config', 'hoodie/sharing/hoodie'], (Config, SharingHoodie) ->

  class SharingInstance

    # if the current user isn't anonymous (has an accoutn), a backend worker is 
    # used for the whole sharing magic, all we need to do is creating the $sharing 
    # doc and listen to its remote changes
    #
    # if the user is anonymous, we need to handle it manually. To achieve that
    # we use a customized hoodie, with a custom connection
    anonymous: undefined
      
    constructor: (@hoodie, attributes = {}) ->
      
      @anonymous = @hoodie.account.username is undefined
      
      # make sure we have an id, as we need it for the config
      @id or= @hoodie.store.uuid(7)
      
      # setting attributes
      @attributes attributes
      
      # user the $sharing doc directly for configuration settings
      @config = new Config @hoodie, type: '$sharing', id: @id
      

      if @anonymous
        @hoodie = new SharingHoodie @hoodie, this
    
    # ## attributes
    #
    # attributes getter & setter
    attributes: (update) ->
      if update
        update.private    = true if update.invitees?
        update.password or= @id
        
        {
          @id, 
          @filters, 
          @private, 
          @invitees, 
          @continuous, 
          @collaborative,
          @password
        } = update
      
      private       : @private  
      invitees      : @invitees  
      continuous    : @continuous  
      collaborative : @collaborative
      password      : @password
      filter        : @_turn_filters_into_function @filters
       
    create: ->
      defer = @hoodie.defer()
      
      @hoodie.store.save( "$sharing", @id, @attributes() )
      
      # when anonymous, we need to create the sharing db manually,
      # by signing up as a user with the neame of the sharing db.
      if @anonymous
        @hoodie.account.sign_up( "sharing/#{@id}", @password )
        
        # TODO: better error handling
        .fail (error) =>
          if error.error is 'conflict'
            alert "sharing/#{@id} has been shared before"
            
      else
        @hoodie.one "remote:updated:$sharing:#{@id}", defer.resolve
      
      defer.promise()
      
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