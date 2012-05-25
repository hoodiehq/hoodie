define 'hoodie/sharing/instance', ['hoodie/config'], (Config) ->

  class SharingInstance

    constructor: (@hoodie, attributes = {}) ->
      attributes.id or= @hoodie.store.uuid(7)
      @config = new Config @hoodie, type: '$sharing', id: attributes.id
      funky = 1
        
    create: ->
      defer = @hoodie.defer()
      
      options.private = true if options.invitees?
      options.filter   = @_turn_filters_into_function options.filters
      delete options.filters
      
      @hoodie.store.save("$sharing", options.id, options)
      .done (sharing) => @hoodie.one "remote:created:$sharing:#{sharing.id}", defer.resolve
      
      defer.promise()