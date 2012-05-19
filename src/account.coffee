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
        success: (response) =>
          if response.userCtx.name
            @_authenticated = true
            @email = response.userCtx.name
            defer.resolve @email
          else
            @_authenticated = false
            @app.trigger 'account:error:unauthenticated'
            defer.reject()
            
        error: defer.reject
          
      return defer.promise()
      
      
        
    # ## sign up with email & password
    #
    # uses standard couchDB API to create a new document in _users db.
    # The backend will automatically create a userDB based on the email
    # address.
    #
    sign_up : (email, password, attributes = {}) ->
      defer = @app.defer()
      
      prefix  = 'org.couchdb.user'
      key     = "#{prefix}:#{email}"

      @app.request 'PUT', "/_users/#{encodeURIComponent key}",
        
        data: JSON.stringify
          _id        : key
          name       : email
          type       : 'user'
          roles      : []
          password   : password
          attributes : attributes
          
        contentType:  'application/json'
        
        success   : => 
          # {"ok":true,"id":"org.couchdb.user:funk","rev":"1-0a8c05f25b227b4689bbdcf55af06afc"}
          @app.trigger 'account:signed_up', email
          @app.trigger 'account:signed_in', email
          defer.resolve email
          
        error: defer.reject
        
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
          
        success : => 
          @app.trigger 'account:signed_in', email
          defer.resolve email
        error   : defer.reject
      
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
    
    # 

    # ## PRIVATE
    #
    
    #
    _handle_sign_in: (@email) =>
      @app.store.db.setItem '_couch.account.email', @email
      @_authenticated = true
    
    #
    _handle_sign_out: =>
      delete @email
      @app.store.db.removeItem '_couch.account.email'
      @_authenticated = false