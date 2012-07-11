#
# Hoodie.Account
#
# write something here ...
#

class Hoodie.Account
  
  # ## Properties
  username    : undefined
  
  
  # ## Constructor
  #
  constructor : (@hoodie) ->
    
    # handle session
    @username = @hoodie.config.get '_account.username'
    
    # authenticate on next tick
    # window.setTimeout @authenticate
    @on 'signed_in',  @_handle_sign_in
    @on 'signed_out', @_handle_sign_out
  
  
  # ## Authenticate
  # 
  # Use this method to assure that the user is authenticated:
  # `hoodie.account.authenticate().done( do_something ).fail( handle_error )`
  authenticate : =>
    defer = @hoodie.defer()
    
    unless @username
      return defer.reject().promise()
      
    if @_authenticated is true
      return defer.resolve(@username).promise()
      
    if @_authenticated is false
      return defer.reject().promise()
    
    # @_authenticated is undefined
    @_auth_request = @hoodie.request 'GET', "/_session"

    @_auth_request.done (response) =>
      if response.userCtx.name
        @_authenticated = true
        @username = response.userCtx.name
        defer.resolve @username
      else
        @_authenticated = false
        delete @username
        @hoodie.trigger 'account:error:unauthenticated'
        defer.reject()
          
    @_auth_request.fail (xhr) ->
      try
        error = JSON.parse(xhr.responseText)
      catch e
        error = error: xhr.responseText or "unknown"
        
      defer.reject(error)
        
    return defer.promise()
    
    
  # ## sign up with username & password
  #
  # uses standard couchDB API to create a new document in _users db.
  # The backend will automatically create a userDB based on the username
  # address.
  #
  sign_up : (username, password = '') ->
    defer = @hoodie.defer()
    
    key     = "#{@_prefix}:#{username}"

    data = 
      _id        : key
      name       : username
      type       : 'user'
      roles      : []
      password   : password

    request_promise = @hoodie.request 'PUT', "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify data
      contentType : 'application/json'
      
    handle_succes = (response) =>
        @hoodie.trigger 'account:signed_up', username
        @_doc._rev = response.rev
        @sign_in(username, password).then defer.resolve, defer.reject

    request_promise.then handle_succes, defer.reject
      
    return defer.promise()


  # ## sign in with username & password
  #
  # uses standard couchDB API to create a new user session (POST /_session)
  #
  sign_in : (username, password = '') ->
    defer = @hoodie.defer()

    request_promise = @hoodie.request 'POST', '/_session', 
      data: 
        name      : username
        password  : password
        
    handle_succes = (response) =>
      @hoodie.trigger 'account:signed_in', username
      @fetch()
      defer.resolve username, response
    
    request_promise.then handle_succes, defer.reject
    
    return defer.promise()

  # alias
  login: @::sign_in


  # ## change password
  #
  # NOTE: simple implementation, current_password is ignored.
  #
  change_password : (current_password = '', new_password) ->
    defer = @hoodie.defer()
    unless @username
      defer.reject error: "unauthenticated", reason: "not logged in"
      return defer.promise()
    
    key = "#{@_prefix}:#{@username}"
    
    data = $.extend {}, @_doc
    delete data.salt
    delete data.password_sha
    data.password = new_password
    
    @hoodie.request 'PUT',  "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify data
      contentType : "application/json"
      success     : (response) =>
        @fetch()
        defer.resolve()
        
      error       : (xhr) ->
        try
          error = JSON.parse(xhr.responseText)
        catch e
          error = error: xhr.responseText or "unknown"
          
        defer.reject(error)


  # ## sign out 
  #
  # uses standard couchDB API to destroy a user session (DELETE /_session)
  #
  # TODO: handle errors
  sign_out: ->
    @hoodie.request 'DELETE', '/_session', 
      success : => @hoodie.trigger 'account:signed_out'

  # alias
  logout: @::sign_out
  
  
  # ## On
  #
  # alias for `hoodie.on`
  on : (event, cb) -> @hoodie.on "account:#{event}", cb
  
  
  # ## db
  #
  # escape user username (or what ever he uses to sign up)
  # to make it a valid couchDB database name
  # 
  #     Converts an username address user name to a valid database name
  #     The character replacement rules are:
  #       [A-Z] -> [a-z]
  #       @ -> $
  #       . -> _
  #     Notes:
  #      can't reverse because _ are valid before the @.
  #
  #
  db : -> 
    @username?.toLowerCase().replace(/@/, "$").replace(/\./g, "_");
    
    
  # ## fetch
  #
  # fetches _users doc from CouchDB and caches it in _doc
  fetch : ->
    defer = @hoodie.defer()
    
    unless @username
      defer.reject error: "unauthenticated", reason: "not logged in"
      return defer.promise()
    
    key = "#{@_prefix}:#{@username}"
    @hoodie.request 'GET', "/_users/#{encodeURIComponent key}",
    
      success     : (response) => 
        @_doc = response
        defer.resolve response
      
      error       : (xhr) ->
        try
          error = JSON.parse(xhr.responseText)
        catch e
          error = error: xhr.responseText or "unknown"
          
        defer.reject(error) 
        
    return defer.promise()
    
    
  # ## destroy
  #
  # destroys a user' account  
  destroy: ->
    @fetch().pipe =>
      key = "#{@_prefix}:#{@username}"
      @hoodie.request 'DELETE', "/_users/#{encodeURIComponent key}?rev=#{@_doc._rev}"


  # ## PRIVATE
  #
  _prefix : 'org.couchdb.user'
  
  # couchDB _users doc
  _doc : {}
  
  #
  _handle_sign_in: (@username) =>
    @hoodie.config.set '_account.username', @username
    @_authenticated = true
  
  #
  _handle_sign_out: =>
    delete @username
    @hoodie.config.remove '_account.username'
    @_authenticated = false
