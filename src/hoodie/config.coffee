#
# Central Config API
#

define 'hoodie/config', ->
  
  # 'use strict'
  
  class Config
    
    # used as attribute name in localStorage
    type : '$config'
    id   : 'hoodie'
    
    # memory cache
    cache : {}
    
    # ## Constructor
    #
    constructor : (@hoodie, options = {}) ->
      @type       = options.type       if options.type
      @id         = options.id         if options.id
      
      @hoodie.store.load(@type, @id).done (obj) => @cache = obj
    
      
    # ## set
    #
    # adds a configuration
    #
    set : (key, value) ->
      return if @cache[key] is value
      
      @cache[key] = value
      
      update = {}
      update[key] = value
      
      if key.charAt(0) is '_'
        # silent update
        @hoodie.store.update @type, @id, update, silent: true
      else
        @hoodie.store.update @type, @id, update
        
    
    # ## get
    #
    # receives a configuration
    #
    get : (key) -> 
      @cache[key]
    
    
    # ## remove
    # 
    # removes a configuration, is a simple alias for config.set(key, undefined)
    #
    remove : @::set