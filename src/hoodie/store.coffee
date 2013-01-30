# Store
# ============

# This class defines the API that other Stores have to implement to assure a
# coherent API.
# 
# It also implements some validations and functionality that is the same across
# store impnementations

class Hoodie.Store


  # ## Constructor

  # set store.hoodie instance variable
  constructor : (@hoodie) ->


  # ## Save

  # creates or replaces an an eventually existing object in the store
  # with same type & id.
  #
  # When id is undefined, it gets generated and a new object gets saved
  #
  # example usage:
  #
  #     store.save('car', undefined, {color: 'red'})
  #     store.save('car', 'abc4567', {color: 'red'})
  save : (type, id, object, options = {}) ->
    defer = @hoodie.defer()
  
    unless typeof object is 'object'
      defer.reject Hoodie.Errors.INVALID_ARGUMENTS "object is #{typeof object}"
      return defer.promise()
    
    # validations
    if id and not @_isValidId id
      return defer.reject( Hoodie.Errors.INVALID_KEY id: id ).promise()
      
    unless @_isValidType type
      return defer.reject( Hoodie.Errors.INVALID_KEY type: type ).promise()

    return defer
  
  
  # ## Add

  # `.add` is an alias for `.save`, with the difference that there is no id argument.
  # Internally it simply calls `.save(type, undefined, object).
  add : (type, object = {}, options = {}) ->
    @save type, object.id, object
  
  
  # ## Update

  # In contrast to `.save`, the `.update` method does not replace the stored object,
  # but only changes the passed attributes of an exsting object, if it exists
  #
  # both a hash of key/values or a function that applies the update to the passed
  # object can be passed.
  #
  # example usage
  #
  # hoodie.store.update('car', 'abc4567', {sold: true})
  # hoodie.store.update('car', 'abc4567', function(obj) { obj.sold = true })
  update : (type, id, objectUpdate, options) ->
    defer = @hoodie.defer()
    
    _loadPromise = @find(type, id).pipe (currentObj) => 
      
      # normalize input
      newObj = $.extend(true, {}, currentObj)
      objectUpdate = objectUpdate( newObj ) if typeof objectUpdate is 'function'
      
      return defer.resolve currentObj unless objectUpdate
      
      # check if something changed
      changedProperties = for key, value of objectUpdate when currentObj[key] isnt value
        # workaround for undefined values, as $.extend ignores these
        newObj[key] = value
        key
        
      return defer.resolve newObj unless changedProperties.length or options
      
      # apply update 
      @save(type, id, newObj, options).then defer.resolve, defer.reject
      
    # if not found, add it
    _loadPromise.fail => 
      @save(type, id, objectUpdate, options).then defer.resolve, defer.reject
    
    defer.promise()
  
  
  # ## updateAll

  # update all objects in the store, can be optionally filtered by a function
  # As an alternative, an array of objects can be passed
  #
  # example usage
  #
  # hoodie.store.updateAll()
  updateAll : (filterOrObjects, objectUpdate, options = {}) ->
    
    # normalize the input: make sure we have all objects
    switch true
      when typeof filterOrObjects is 'string'
        promise = @findAll filterOrObjects
      when @hoodie.isPromise(filterOrObjects)
        promise = filterOrObjects
      when $.isArray filterOrObjects
        promise = @hoodie.defer().resolve( filterOrObjects ).promise()
      else # e.g. null, update all
        promise = @findAll()
    
    promise.pipe (objects) =>
      # now we update all objects one by one and return a promise
      # that will be resolved once all updates have been finished
      defer = @hoodie.defer()
      objects = [objects] unless $.isArray objects
      _updatePromises = for object in objects
        @update(object.$type, object.id, objectUpdate, options)
      $.when.apply(null, _updatePromises).then defer.resolve
      
      return defer.promise()


  # ## find

  # loads one object from Store, specified by `type` and `id`
  #
  # example usage:
  #
  #     store.find('car', 'abc4567')
  find : (type, id) ->
    defer = @hoodie.defer()
  
    unless typeof type is 'string' and typeof id is 'string'
      return defer.reject( Hoodie.Errors.INVALID_ARGUMENTS "type & id are required" ).promise()
  
    return defer
  

  # ## find or add
  
  # 1. Try to find a share by given id
  # 2. If share could be found, return it
  # 3. If not, add one and return it.
  findOrAdd : (type, id, attributes = {}) ->
    defer = @hoodie.defer()
    @find(type, id)
    .done( defer.resolve )
    .fail => 
      newAttributes = $.extend true, id: id, attributes
      @add(type, newAttributes).then defer.resolve, defer.reject 
  
    return defer.promise()
  
  
  # ## findAll

  # returns all objects from store. 
  # Can be optionally filtered by a type or a function
  findAll : -> @hoodie.defer()
  
  
  # ## Destroy

  # Destroyes one object specified by `type` and `id`. 
  # 
  # when object has been synced before, mark it as deleted. 
  # Otherwise remove it from Store.
  remove : (type, id, options = {}) ->
    defer = @hoodie.defer()
  
    unless typeof type is 'string' and typeof id is 'string'
      return defer.reject( Hoodie.Errors.INVALID_ARGUMENTS "type & id are required" ).promise()

    return defer


  # ## removeAll

  # Destroyes all objects. Can be filtered by a type
  removeAll : (type, options = {}) -> 
    @findAll(type).pipe (objects) =>
      @remove(object.$type, object.id, options) for object in objects
  

  # ## Private

  #
  _now : -> new Date

  # only lowercase letters, numbers and dashes are allowed for ids
  _isValidId : (key) ->
    /^[a-z0-9\-]+$/.test key
    
  # just like ids, but must start with a letter or a $ (internal types)
  _isValidType : (key) ->
    /^[a-z$][a-z0-9]+$/.test key