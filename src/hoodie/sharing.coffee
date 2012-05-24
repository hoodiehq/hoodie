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
#    When the sharing gets destroyed, the sharing user will me deleted and the userDB worker
#    will handle the rest.
#
#    Once a user signes up, the custom $sharing sockets will be closed and the $sharing workers
#    will take over.
#

define 'hoodie/sharing', ->
  
  # 'use strict'
  
  class Sharing
  
    # ## Constructor
    #
    constructor : (@hoodie) ->
      
      # do some smart stuff in here!
      
    # ## create
    #
    # creates a new sharing & returns a promise.
    # Options
    #
    #     id:            (default: random uuid)
    #                    sets the name of your sharing.
    #     filters:       (optional)
    #                    one or multiple key/value hashes with conditions 
    #                    for the objects to be filtered.
    #     private:       (default: false)
    #                    when set to true, nobody but the creator and the
    #                    invitees have acces. Set to true automatically
    #                    when invitees passed
    #     invitees:      (optional)
    #                    an array of user names (emails) that should have
    #                    to the shared documents
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
    #       alert "find by stuff at /#{sharing.id}"
    # 
    #     # share my todo list with Joey and Frank
    #     hoodie.sharing.create
    #       invitees : [
    #         "joey@example.com"
    #         "frank@example.com"
    #       ]
    #       filters   : [
    #         id           : todo_list.id
    #         todo_list_id : todo_list.id
    #       ]
    #     
    #     # share all my documents that I marked as
    #     # shared and keep them updated
    #     hoodie.sharing.create
    #       continuous : true
    #       filters     : shared: true
    #
    create : (options) ->
      defer = @hoodie.defer()
      
      options.private = true if options.invitees?
      options.filter   = @_turn_filters_into_function options.filters
      delete options.filters
      
      @hoodie.store.save("$sharing", options.id, options)
      .done (sharing) => @hoodie.one "remote:created:$sharing:#{sharing.id}", defer.resolve
      
      defer.promise()
      
    # ## destroy
    #
    # deletes an existing sharing
    #
    destroy: (id) ->
      @hoodie.store.destroy "$sharing", id
      
    # alias
    delete: @::destroy
    
    
    # ## Private
  
    _turn_filters_into_function: (filters) ->
      return unless filters
    
      all_conditions = []
      for filter in filters
        current_condition = []
        for key, value of filter
        
          # no code injection, please
          continue if /'/.test "#{key}#{value}"
        
          if typeof value is 'string'
            current_condition.push "obj['#{key}'] == '#{value}'"
          else
            current_condition.push "obj['#{key}'] == #{value}"
          
        all_conditions.push current_condition.join " && "
      
      "function(obj) { return #{all_conditions.join " || "} }"