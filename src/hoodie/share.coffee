# Share Module
# ==============

# technically, sharing objects works in two different ways, 
# depending on whether the user has an account or not.
#
# 1. with account
#
#    If the user has an account, share is handled by the $share backend worker.
#    When a share gets created, a $share doc gets stored and synched to users 
#    database. From there the $share worker handles the rest:
#    
#    * creating a share database
#    * creating a user if a password is used
#    * handling the replications
#
#    The worker updates the $share doc status, which gets synched back to the 
#    frontend. When the user deletes the $share doc, the worker removes the 
#    database, the user and all replications
#
# 2. without an account
#
#    If the use has no account, the $share database gets created right from 
#    the frontend. With an adjusted Hoodie class, a special user for the share 
#    gets created, which will also create a share database with the help of 
#    the userDB worker. Once the db is created, the docs, filtered by the 
#    share filter, will be pushed to the share database.
#
#    When the share gets destroyed, the share user will be deleted and the 
#    userDB worker will handle the rest.
#
#    Once a user signes up, the custom $share sockets will be closed and the 
#    $share workers will take over.
#
#
# API
# -----
# 

#
class Hoodie.Share

  # ## Constructor
  #
  constructor : (@hoodie) ->
    
    # allow hoodie.share to be called as function:
    # hoodie.share('share_id') // opens a share
    api = @open

    # set pointer to Hoodie.Share.Instance
    @instance = Hoodie.Share.Instance

    # give all Share instances access to our core hoodie
    # as shares use custom hoodies, as long as the user
    # has no account yet
    @instance.hoodie = @hoodie

    $.extend api, this

    return api
  
  
  # ## open
  
  # 
  # open a sharing
  # 
  open : (share_id, options) =>
    new @instance id: share_id, options


  # ## create

  # creates a new share & returns a promise.
  #
  create : (attributes = {}) ->
    share = new @instance attributes
    share.save()
    
  
  # ## find

  # find an existing share
  #
  find : (id) ->
    @hoodie.my.store.find('$share', id).pipe (object) =>
      new @instance object


  # ## findAll

  # find all my existing shares
  #
  findAll : ->
    @hoodie.my.store.findAll('$share').pipe (objects) =>
      new @instance obj for obj in objects


  # ## findOrCreate

  # find or create a new share
  #
  findOrCreate : (attributes) ->
    attributes.type = '$share'
    @hoodie.my.store.findOrCreate(attributes).pipe (object) =>
      new @instance object


  # ## save

  # create or overwrite a share
  #
  save : (id, attributes) ->
    @hoodie.my.store.save('$share', id, attributes).pipe (object) =>
      new @instance object


  # ## update

  # create or overwrite a share
  #
  update : (id, attributes) ->
    @hoodie.my.store.update('$share', id, attributes).pipe (object) =>
      new @instance object


  # ## updateAll

  # update all my existing shares
  #
  updateAll : ( changed_attributes ) ->
    @hoodie.my.store.updateAll('$share', changed_attributes).pipe (objects) =>
      new @instance obj for obj in objects


  # ## destroy

  # deletes an existing share
  #
  destroy : (id) ->
    @find(id).pipe (obj) =>
      share = new @instance obj
      share.destroy()

  delete: -> @destroy arguments...

  destroyAll : () ->
    @findAll().pipe (objects) =>
      for obj in objects
        share = new @instance obj
        share.destroy()

  deleteAll: -> @destroyAll arguments...