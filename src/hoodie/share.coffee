#
# Share your data
#

#
# technically, share works in two different ways, depending on whether the user has an
# account or not.
#
# 1. with account
#
#    If the user has an account, share is handled by the $share backend worker. When
#    a share gets created, a $share doc gets stored and synched to users database.
#    From there the $share worker handles the rest:
#    
#    * creating a share database
#    * creating a user if a password is used
#    * handling the replications
#
#    The worker updates the $share doc status, which gets synched back to the frontend.
#    When the user deletes the $share doc, the worker removes the database, the user
#    and all replications
#
# 2. without an account
#
#    If the use has no account, the $share database gets created right from the frontend.
#    With an adjusted Hoodie class, a special user for the share gets created, which will
#    also create a share database with the help of the userDB worker. Once the db is
#    created, the docs, filtered by the share filter, will be pushed to the share database.
#
#    When the share gets destroyed, the share user will be deleted and the userDB worker
#    will handle the rest.
#
#    Once a user signes up, the custom $share sockets will be closed and the $share workers
#    will take over.
#


class Hoodie.Share


  # ## Constructor
  #
  constructor : (@hoodie) ->
    
    # give all Share instances access to our core hoodie
    # as shares use custom hoodies, as long as the user
    # has no account yet
    Hoodie.Share.Instance.hoodie = @hoodie
    
    
  # ## create
  #
  # creates a new share & returns a promise.
  # Options
  #
  #     id:            (optional, defaults to random uuid)
  #                    name of share.
  #     objects:       (optional)
  #                    array of objects that should be shared
  #     private:       (default: false)
  #                    when set to true, nobody but the creator and the
  #                    invitees have access. Set to true automatically
  #                    when invitees passed
  #     invitees:      (optional)
  #                    an array of user names (emails) that should have
  #                    access to the shared documents
  #     continuous:    (default: false)
  #                    if set to true, the shared objects will be
  #                    continuously updated.
  #     collaborative: (default: false)
  #                    if set to true, others are invited to make changes
  #                    to the shared documents
  #
  # Examples
  #
  #     # share all my stuff
  #     hoodie.share.create().done (share) -> 
  #       alert "find my stuff at /#{share.id}"
  # 
  #     # share my todo list with Joey and Frank
  #     hoodie.share.create
  #       invitees : [
  #         "joey@example.com"
  #         "frank@example.com"
  #       ]
  #       objects : [
  #         todoList, todo1, todo2, todo3
  #       ]
  #     
  #     # share all my documents that I marked as
  #     # shared and keep them updated
  #     hoodie.share.create
  #       continuous : true
  #       objects    : hoodie.my.store.loadAll (obj) -> obj.isShared
  #
  create : (options = {}) ->
    share = new Hoodie.Share.Instance options
    share.save()
    
  
  # ## load
  #
  # load an existing share
  #
  load : (id) ->
    @hoodie.my.store.load('$share', id).pipe (obj) =>
      new Hoodie.Share.Instance obj
  
  
  # ## find or create
  #
  # 1. Try to find a share by given id
  # 2. If share could be found, return it
  # 3. If not, create one and return it.
  findOrCreate : (options) ->
    defer = @hoodie.defer()
    @load(options.id)
    .done (share) ->
      defer.resolve share
    .fail => 
      @create(options).then defer.resolve, defer.reject 
  
    return defer.promise()
  
  
  # ## destroy
  #
  # deletes an existing share
  #
  destroy : (id) ->
    @load(id).pipe (obj) =>
      share = new Hoodie.Share.Instance obj
      share.destroy()
    
  # alias
  delete : @::destroy
  
  
  # ## open
  #
  # Copy all data of a share to own database
  open : (id, options = {}) ->
    # tbd ...