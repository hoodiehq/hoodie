#
# Sharing your data
#

#
# technically, sharing works in two different ways, depending on whether the user has an
# account or not.
#
# 1. with account
#
#    If the user has an account, sharing is handled by the $sharing backend worker. When
#    a sharing gets created, a $sharing doc gets stored and synched to users database.
#    From there the $sharing worker handles the rest:
#    
#    * creating a sharing database
#    * creating a user if a password is used
#    * handling the replications
#
#    The worker updates the $sharing doc status, which gets synched back to the frontend.
#    When the user deletes the $sharing doc, the worker removes the database, the user
#    and all replications
#
# 2. without an account
#
#    If the use has no account, the $sharing database gets created right from the frontend.
#    With an adjusted Hoodie class, a special user for the sharing gets created, which will
#    also create a sharing database with the help of the userDB worker. Once the db is
#    created, the docs, filtered by the sharing filter, will be pushed to the sharing database.
#
#    When the sharing gets destroyed, the sharing user will be deleted and the userDB worker
#    will handle the rest.
#
#    Once a user signes up, the custom $sharing sockets will be closed and the $sharing workers
#    will take over.
#


define 'hoodie/sharing', ['hoodie/sharing/instance'], (SharingInstance) ->
  
  
  class Sharing
  
    # ## Constructor
    #
    constructor : (@hoodie) ->
      
      # give all Sharing instances access to our core hoodie
      # as sharings might use custom hoodies, in case the user
      # has no account yet
      SharingInstance.hoodie = @hoodie
      
    # ## create
    #
    # creates a new sharing & returns a promise.
    # Options
    #
    #     id:            (optional, defaults to random uuid)
    #                    name of sharing.
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
    #     hoodie.sharing.create().done (sharing) -> 
    #       alert "find my stuff at /#{sharing.id}"
    # 
    #     # share my todo list with Joey and Frank
    #     hoodie.sharing.create
    #       invitees : [
    #         "joey@example.com"
    #         "frank@example.com"
    #       ]
    #       objects : [
    #         todo_list, todo1, todo2, todo3
    #       ]
    #     
    #     # share all my documents that I marked as
    #     # shared and keep them updated
    #     hoodie.sharing.create
    #       continuous : true
    #       objects    : hoodie.store.loadAll (obj) -> obj.is_shared
    #
    create : (options = {}) ->
      SharingInstance.create options
    
    # ## load
    #
    # load an existing sharing
    #
    load : (id) ->
      SharingInstance.load id
    
    
    # ## find or create
    #
    # 1. Try to find a sharing by given id
    # 2. If sharing could be found, return it
    # 3. If not, create one and return it.
    find_or_create: (options) ->
      defer = @hoodie.defer()
      SharingInstance.load(options.id)
      .done (sharing) ->
        defer.resolve sharing
      .fail -> 
        SharingInstance.create(options).then defer.resolve, defer.reject 
    
      return defer.promise()
    
    # ## destroy
    #
    # deletes an existing sharing
    #
    destroy: (id) ->
      SharingInstance.destroy id
      
    # ## open
    #
    # Copy all data of a sharing to own database
    open: (id, options = {}) ->
      # tbd ...
    
    # alias
    delete: @::destroy
