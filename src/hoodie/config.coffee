#
# Central Config API
#

define 'hoodie/config', ->
  
  # 'use strict'
  
  class Config
    
    # used as attribute name in localStorage
    namespace : 'hoodie'
    
    # memory cache
    cache : {}
    
    
    # ## Constructor
    #
    constructor : (@hoodie, options = {}) ->
      @namespace = options.namespace if options.namespace
      @hoodie.store.load('$config', @namespace).done (obj) => @cache = obj
    
      
    # ## set
    #
    # adds a configuration
    #
    set : (key, value) ->
      update = {}
      update[key] = value
      @hoodie.store.update "$config", @namespace, update
      @cache[key] = value
      
    
    # ## get
    #
    # receives a configuration
    #
    get : (key) ->
      return @cache[key] if @cache[key]
      
    
    # ## remove
    # 
    # removes a configuration, is a simple alias for config.set(key, undefined)
    #
    remove : @::set
    