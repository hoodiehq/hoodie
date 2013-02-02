# Share Module
# ==============

# When a share gets created, a $share doc gets stored and synched to the user's 
# database. From there the $share worker handles the rest:
# 
# * creating a share database
# * creating a share user if a password is used (to be done)
# * handling the replications
#
# The worker updates the $share doc status, which gets synched back to the 
# frontend. When the user deletes the $share doc, the worker removes the 
# database, the user and all replications
#
#
# API
# -----
#     
#     // returns a share instance
#     // with share.id set to 'share_id'
#     hoodie.share('share_id')
#     
#     // the rest of the API is a standard store API, with the 
#     // difference that no type has to be set and the returned
#     // promises are resolved with share instances instead of
#     // simple objects
#     hoodie.share.add(attributes)
#     hoodie.share.find('share_id')
#     hoodie.share.findAll()
#     hoodie.share.findOrAdd(id, attributes)
#     hoodie.share.save(id, attributes)
#     hoodie.share.update(id, changed_attributes)
#     hoodie.share.updateAll(changed_attributes)
#     hoodie.share.remove(id)
#     hoodie.share.removeAll()

#
class Hoodie.Share


  # Constructor
  # -------------

  # the constructor returns a function, so it can be called
  # like this: hoodie.share('share_id')
  #
  # The rest of the API is available as usual.
  constructor : (@hoodie) ->

    # set pointer to Hoodie.ShareInstance
    @instance = Hoodie.ShareInstance

    # return custom api which allows direct call
    api = @_open
    $.extend api, this

    # extend hodie.store promise API
    @hoodie.store.decoratePromises
      shareAt   : @_storeShareAt
      unshareAt : @_storeUnshareAt
      unshare   : @_storeUnshare
      share     : @_storeShare

    return api


  # add
  # --------

  # creates a new share and returns it
  #
  add : (options = {}) ->
    @hoodie.store.add('$share', @_filterShareOptions(options)).pipe (object) =>
      unless @hoodie.account.hasAccount()
        @hoodie.account.anonymousSignUp()

      new @instance @hoodie, object
    
  
  # find
  # ------

  # find an existing share
  #
  find : (id) ->
    @hoodie.store.find('$share', id).pipe (object) =>
      new @instance @hoodie, object


  # findAll
  # ---------

  # find all my existing shares
  #
  findAll : ->
    @hoodie.store.findAll('$share').pipe (objects) =>
      new @instance @hoodie, obj for obj in objects


  # findOrAdd
  # --------------

  # find or add a new share
  #
  findOrAdd : (id, options) ->
    @hoodie.store.findOrAdd('$share', id, @_filterShareOptions options).pipe (object) =>
      unless @hoodie.account.hasAccount()
        @hoodie.account.anonymousSignUp()
        
      new @instance @hoodie, object


  # save
  # ------

  # add or overwrite a share
  #
  save : (id, options) ->
    @hoodie.store.save('$share', id, @_filterShareOptions options).pipe (object) =>
      new @instance @hoodie, object


  # update
  # --------

  # add or overwrite a share
  #
  update : (id, changed_options) ->
    @hoodie.store.update('$share', id, @_filterShareOptions changed_options).pipe (object) =>
      new @instance @hoodie, object


  # updateAll
  # -----------

  # update all my existing shares
  #
  updateAll : ( changed_options ) ->
    @hoodie.store.updateAll('$share', @_filterShareOptions changed_options).pipe (objects) =>
      new @instance @hoodie, obj for obj in objects


  # remove
  # ---------

  # deletes an existing share
  #
  remove : (id) ->
    @hoodie.store.findAll( (obj) -> obj.$shares[id] ).unshareAt( id )
    @hoodie.store.remove('$share', id)
  
  
  # removeAll
  # ------------

  # delete all existing shares
  #
  removeAll : () ->
    @hoodie.store.findAll( (obj) -> obj.$shares ).unshare()
    @hoodie.store.removeAll('$share')


  # Private
  # ---------

  _allowedOptions: ["id", "access", "createdBy"]

  # ### filter share options
  #
  _filterShareOptions: (options = {}) ->
    filteredOptions = {}
    for option in @_allowedOptions when options.hasOwnProperty option
      filteredOptions[option] = options[option]
    filteredOptions

  # ### open
  #
  # opens a a remote share store, returns a Hoodie.Remote instance
  _open : (shareId, options = {}) =>
    $.extend options, {id: shareId}
    new @instance @hoodie, options


  # hoodie.store decorations
  # --------------------------
  # 
  # hoodie.store decorations add custom methods to promises returned
  # by hoodie.store methods like find, add or update. All methods return
  # methods again that will be executed in the scope of the promise, but
  # with access to the current hoodie instance

  # shareAt
  # 
  _storeShareAt : (shareId, properties) ->
    @pipe (objects) =>

      updateObject = (object) =>
        object.$shares or= {}
        object.$shares[shareId] = properties or true
        @hoodie.store.update object.type, object.id, $shares: object.$shares
        return object
    
      if $.isArray objects
        updateObject(object) for object in objects
      else 
        updateObject(objects)

  
  # unshareAt
  #
  _storeUnshareAt : (shareId) ->
    @pipe (objects) =>

      updateObject = (object) =>
        return object unless object.$shares and object.$shares[shareId]
        object.$shares[shareId] = false
        @hoodie.store.update object.type, object.id, $shares: object.$shares
        return object
    
      if $.isArray objects
        updateObject(object) for object in objects
      else 
        updateObject(objects)

  # unshare
  #
  _storeUnshare : () ->
    @pipe (objects) =>

      updateObject = (object) =>
        return object unless object.$shares
        for shareId of object.$shares
          object.$shares[shareId] = false
        @hoodie.store.update object.type, object.id, $shares: object.$shares
        return object

      if $.isArray objects
        updateObject(object) for object in objects
      else 
        updateObject(objects)

  # share
  #
  _storeShare : (properties) -> 

    @pipe (objects) =>
      
      @hoodie.share.add().pipe (newShare) => 

        updateObject = (object) =>
          object.$shares or= {}
          object.$shares[newShare.id] = properties or true
          @hoodie.store.update object.type, object.id, $shares: object.$shares
          return object

        value = if $.isArray objects
          updateObject(object) for object in objects
        else 
          updateObject(objects)
      
        return @hoodie.defer().resolve(value, newShare).promise()



# extend Hoodie
Hoodie.extend 'share', Hoodie.Share