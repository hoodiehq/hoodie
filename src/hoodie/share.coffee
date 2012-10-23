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
#     hoodie.share.create(attributes)
#     hoodie.share.find('share_id')
#     hoodie.share.findAll()
#     hoodie.share.findOrCreate(id, attributes)
#     hoodie.share.save(id, attributes)
#     hoodie.share.update(id, changed_attributes)
#     hoodie.share.updateAll(changed_attributes)

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

    # give all Share instances access to our core hoodie.
    # That's need if the user has no account yet, as shares
    # use custom hoodie instances then to create shares on
    # the server
    Hoodie.ShareInstance.prototype.hoodie = @hoodie

    # return custom api which allows direct call
    api = @open
    $.extend api, this

    return api
  
  
  # open
  # ------
  
  # 
  # open a sharing
  # 
  open : (shareId, options = {}) =>
    dbName = "share/#{shareId}"
    options.prefix = dbName
    @hoodie.open dbName, options


  # create
  # --------

  # creates a new share and returns it
  #
  create : (attributes = {}) ->
    share = new @instance attributes
    share.save()
    share
    
  
  # find
  # ------

  # find an existing share
  #
  find : (id) ->
    @hoodie.my.store.find('$share', id).pipe (object) =>
      new @instance object


  # findAll
  # ---------

  # find all my existing shares
  #
  findAll : ->
    @hoodie.my.store.findAll('$share').pipe (objects) =>
      new @instance obj for obj in objects


  # findOrCreate
  # --------------

  # find or create a new share
  #
  findOrCreate : (id, attributes) ->
    @hoodie.my.store.findOrCreate('$share', id, attributes).pipe (object) =>
      new @instance object


  # save
  # ------

  # create or overwrite a share
  #
  save : (id, attributes) ->
    @hoodie.my.store.save('$share', id, attributes).pipe (object) =>
      new @instance object


  # update
  # --------

  # create or overwrite a share
  #
  update : (id, changed_attributes) ->
    @hoodie.my.store.update('$share', id, changed_attributes).pipe (object) =>
      new @instance object


  # updateAll
  # -----------

  # update all my existing shares
  #
  updateAll : ( changed_attributes ) ->
    @hoodie.my.store.updateAll('$share', changed_attributes).pipe (objects) =>
      new @instance obj for obj in objects


  # destroy
  # ---------

  # deletes an existing share
  #
  destroy : (id) ->
    @find(id).pipe (obj) =>
      share = new @instance obj
      share.destroy()

  # alias
  delete: -> @destroy arguments...
  
  
  # destroyAll
  # ------------

  # delete all existing shares
  #
  destroyAll : () ->
    @findAll().pipe (objects) =>
      for obj in objects
        share = new @instance obj
        share.destroy()

  # alias
  deleteAll: -> @destroyAll arguments...