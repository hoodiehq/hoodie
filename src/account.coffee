#
# window.localStrage wrapper and more
#

define 'account', ->
  
  # 'use strict'
  
  class Account
    
    # ## Properties
    email: undefined
    
    # ## Constructor
    #
    constructor : (@app) ->
      
      # handle evtl session
      @email = @app.store.db.getItem '_couch.account.email'
      @authenticate()
      
      @on 'signed_in',  @_handle_sign_in
      @on 'signed_out', @_handle_sign_out
    
    # ## Authenticate
    # 
    # Use this method to assure that the user is authenticated:
    # `app.account.authenticate().done( do_something ).fail( handle_error )`
    authenticate : ->
      defer = @app.defer()
      
      unless @email
        return defer.reject().promise()
        
      if @_authenticated is true
        return defer.resolve(@email).promise()
        
      if @_authenticated is false
        return defer.reject().promise()
      
      # @_authenticated is undefined
      @app.request 'GET', "/_session"
      
        success     : (response) =>
          if response.userCtx.name
            @_authenticated = true
            @email = response.userCtx.name
            defer.resolve @email
          else
            @_authenticated = false
            @app.trigger 'account:error:unauthenticated'
            defer.reject()
            
        error       : (xhr) ->
          try
            error = JSON.parse(xhr.responseText)
          catch e
            error = error: xhr.responseText or "unknown"
            
          defer.reject(error)
          
      return defer.promise()
      
      
        
    # ## sign up with email & password
    #
    # uses standard couchDB API to create a new document in _users db.
    # The backend will automatically create a userDB based on the email
    # address.
    #
    sign_up : (email, password, attributes = {}) ->
      defer = @app.defer()
      
      key     = "#{@_prefix}:#{email}"

      @_doc = 
        _id        : key
        name       : email
        type       : 'user'
        roles      : []
        attributes : attributes

      @app.request 'PUT', "/_users/#{encodeURIComponent key}",
        data        : JSON.stringify $.extend(password: password, @_doc)
        contentType : 'application/json'
        
        success     : (response) =>
          @_doc._rev = response.rev
          @app.trigger 'account:signed_up', email
          @app.trigger 'account:signed_in', email
          defer.resolve email
          
        error       : (xhr) ->
          try
            error = JSON.parse(xhr.responseText)
          catch e
            error = error: xhr.responseText or "unknown"
            
          defer.reject(error)
        
      return defer.promise()


    # ## sign in with email & password
    #
    # uses standard couchDB API to create a new user session (POST /_session)
    #
    sign_in : (email, password) ->
      defer = @app.defer()

      @app.request 'POST', '/_session', 
        data: 
          name      : email
          password  : password
          
        success     : => 
          @app.trigger 'account:signed_in', email
          defer.resolve email
        
        error       : (xhr) ->
          try
            error = JSON.parse(xhr.responseText)
          catch e
            error = error: xhr.responseText or "unknown"
            
          defer.reject(error)
      
      return defer.promise()

    # alias
    login: @::sign_in


    # ## change password
    #
    # to be done.
    #
    change_password : (current_password, new_password) ->
      alert('change password is not yet implementd')


    # ## sign out 
    #
    # uses standard couchDB API to destroy a user session (DELETE /_session)
    #
    # TODO: handle errors
    sign_out: ->
      @app.request 'DELETE', '/_session', 
        success : => @app.trigger 'account:signed_out'

    # alias
    logout: @::sign_out
    
    # ## On
    #
    # alias for `app.on`
    on : (event, cb) -> @app.on "account:#{event}", cb
    
    # ## user_db
    #
    # escape user email (or what ever he uses to sign up)
    # to make it a valid couchDB database name
    # 
    #     Converts an email address user name to a valid database name
    #     The character replacement rules are:
    #       [A-Z] -> [a-z]
    #       @ -> $
    #       . -> _
    #     Notes:
    #      can't reverse because _ are valid before the @.
    #
    #
    user_db : -> 
      @email?.toLowerCase().replace(/@/, "$").replace(/\./g, "_");
      
    # ## fetch
    #
    # fetches _users doc from CouchDB and caches it in _doc,
    # without password / password_sha
    fetch : ->
      defer = @app.defer()
      unless @email
        defer.reject error: "unauthenticated", reason: "not logged in"
        return defer.promise()
      
      key = "#{@_prefix}:#{@email}"
      @app.request 'GET', "/_users/#{encodeURIComponent key}",
      
        success     : (response) => 
          delete response.password_sha
          @_doc = response
          defer.resolve response
        
        error       : (xhr) ->
          try
            error = JSON.parse(xhr.responseText)
          catch e
            error = error: xhr.responseText or "unknown"
            
          defer.reject(error) 
          
      return defer.promise()

    # ## PRIVATE
    #
    _prefix : 'org.couchdb.user'
    
    # couchDB _users doc
    _doc : {}
    
    #
    _handle_sign_in: (@email) =>
      @app.store.db.setItem '_couch.account.email', @email
      @_authenticated = true
    
    #
    _handle_sign_out: =>
      delete @email
      @app.store.db.removeItem '_couch.account.email'
      @_authenticated = false