#
# Sharing your data
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
      
      id              = options.id
      options.private = true if options.invitees?
      if options.filters
        unless Array.isArray options.filters
          options.filters = [options.filters]
        
        conditions = []
        for filter in options.filters
          current_condition = []
          for key, value of filter
            
            # no code injection, please
            continue if /'/.test key
            
            if typeof value is 'string'
              current_condition.push "obj['#{key}'] == '#{value}'"
            else
              current_condition.push "obj['#{key}'] == #{value}"
              
          conditions.push current_condition.join " && "
          
        options.filter = "function(obj) { return #{conditions.join " || "} }"
        delete options.filters
      
      delete options.id
      @hoodie.store.save "$sharing", id, options
      @hoodie.one "remote:created:$sharing:#{id}", defer.resolve
      
      defer.promise()
      
    # ## destroy
    #
    # deletes an existing sharing
    #
    destroy: (id) ->
      @hoodie.store.destroy "$sharing", id
      
    # alias
    delete: @::destroy