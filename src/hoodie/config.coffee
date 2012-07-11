#
# Central Config API
#

class Hoodie.Config
  
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

    @hoodie.on 'account:signed_out', @clear
  
    
  # ## set
  #
  # adds a configuration
  #
  set : (key, value) ->
    return if @cache[key] is value
    
    @cache[key] = value
    
    update = {}
    update[key] = value
    
    is_silent = key.charAt(0) is '_'
    @hoodie.store.update @type, @id, update, silent: is_silent
    
  
  # ## get
  #
  # receives a configuration
  #
  get : (key) -> 
    @cache[key]


  # ## clear
  #
  # clears cache and removes object from store
  clear : =>
    @cache = {}
    @hoodie.store.destroy @type, @id
  
  
  # ## remove
  # 
  # removes a configuration, is a simple alias for config.set(key, undefined)
  #
  remove : @::set