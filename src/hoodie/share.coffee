# Share Module
# ==============

# When a share gets created, a $share doc gets stored and synched to users 
# database. From there the $share worker handles the rest:
# 
# * creating a share database
# * creating a share user if a password is used
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
#     // these are equivalent. They return a share instance 
#     // with share.id set to 'share_id'
#     hoodie.share('share_id')
#     hoodie.share.open('share_id')
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

    # give all Share instances access to our hoodie
    @instance.prototype.hoodie = @hoodie

    # return custom api which allows direct call
    api = @_open
    $.extend api, this

    # extend hodie.store promise API
    @hoodie.store.decoratePromises
      shareAt   : @_storeShareAt(@hoodie)
      unshareAt : @_storeUnshareAt(@hoodie)

    return api


  # add
  # --------

  # creates a new share and returns it
  #
  add : (attributes = {}) ->
    share = new @instance attributes
    share.save()
    share
    
  
  # find
  # ------

  # find an existing share
  #
  find : (id) ->
    @hoodie.store.find('$share', id).pipe (object) =>
      new @instance object


  # findAll
  # ---------

  # find all my existing shares
  #
  findAll : ->
    @hoodie.store.findAll('$share').pipe (objects) =>
      new @instance obj for obj in objects


  # findOrAdd
  # --------------

  # find or add a new share
  #
  findOrAdd : (id, attributes) ->
    @hoodie.store.findOrAdd('$share', id, attributes).pipe (object) =>
      new @instance object


  # save
  # ------

  # add or overwrite a share
  #
  save : (id, attributes) ->
    @hoodie.store.save('$share', id, attributes).pipe (object) =>
      new @instance object


  # update
  # --------

  # add or overwrite a share
  #
  update : (id, changed_attributes) ->
    @hoodie.store.update('$share', id, changed_attributes).pipe (object) =>
      new @instance object


  # updateAll
  # -----------

  # update all my existing shares
  #
  updateAll : ( changed_attributes ) ->
    @hoodie.store.updateAll('$share', changed_attributes).pipe (objects) =>
      new @instance obj for obj in objects


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

  # ### open
  
  # opens a a remote share store, returns a Hoodie.Remote instance
  _open : (shareId, options = {}) =>
    $.extend options, {id: shareId}
    new @instance options


  # hoodie.store decorations
  # --------------------------
  # 
  # hoodie.store decorations add custom methods to promises returned
  # by hoodie.store methods like find, add or update. All methods return
  # methods again that will be executed in the scope of the promise, but
  # with access to the current hoodie instance

  # shareAt
  # 
  _storeShareAt : (hoodie) -> (shareId, properties) ->
    @pipe (objects) =>
      objects = [objects] unless $.isArray objects
      for object in objects      
        object.$shares or= {}
        object.$shares[shareId] = properties or true
        hoodie.store.update object.$type, object.id, $shares: object.$shares
  
  # unshareAt
  #
  _storeUnshareAt : (hoodie) -> (shareId) ->
    @pipe (objects) =>
      objects = [objects] unless $.isArray objects
      for object in objects when object.$shares and object.$shares[shareId]
        object.$shares[shareId] = false
        hoodie.store.update object.$type, object.id, $shares: object.$shares