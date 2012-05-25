define 'hoodie/sharing/instance', ->

  class SharingInstance

    constructor: ->
    
    config:
      set     : ->
      get     : ->
      remove  : ->
        
    create: ->
      defer = @hoodie.defer()
      
      options.private = true if options.invitees?
      options.filter   = @_turn_filters_into_function options.filters
      delete options.filters
      
      @hoodie.store.save("$sharing", options.id, options)
      .done (sharing) => @hoodie.one "remote:created:$sharing:#{sharing.id}", defer.resolve
      
      defer.promise()