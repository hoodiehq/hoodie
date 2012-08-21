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
    @username = @hoodie.my.config.get '_account.username'
    @owner    = @hoodie.my.config.get '_account.owner'

    unless @owner
      @owner = @hoodie.my.store.uuid()
      @hoodie.my.config.set '_account.owner', @owner
    
    # authenticate on next tick
    # window.setTimeout @authenticate
    @on 'signin',  @_handleSignIn
    @on 'signout', @_handleSignOut
  
  
  # ## Authenticate
  # 
  # Use this method to assure that the user is authenticated:
  # `hoodie.my.account.authenticate().done( doSomething ).fail( handleError )`
  authenticate : =>
    defer = @hoodie.defer()
    
    unless @username
      return defer.reject().promise()
      
    if @_authenticated is true
      return defer.resolve(@username).promise()
      
    if @_authenticated is false
      return defer.reject().promise()
    
    # @_authenticated is undefined
    @_authRequest = @hoodie.request 'GET', "/_session"

    @_authRequest.done (response) =>
      if response.userCtx.name
        @_authenticated = true
        @username = response.userCtx.name
        defer.resolve @username
      else
        @_authenticated = false
        delete @username
        @hoodie.trigger 'account:error:unauthenticated'
        defer.reject()
          
    @_authRequest.fail (xhr) ->
      try
        error = JSON.parse(xhr.responseText)
      catch e
        error = error: xhr.responseText or "unknown"
        
      defer.reject(error)
        
    return defer.promise()
    
    
  # ## sign up with username & password
  #
  # uses standard CouchDB API to create a new document in _users db.
  # The backend will automatically create a userDB based on the username
  # address and approve the account by adding a "confirmed" role to the
  # user doc. The account confirmation might take a while, so we keep trying
  # to sign in with a 300ms timeout.
  #
  signUp : (username, password = '') ->
    defer = @hoodie.defer()
    
    key = "#{@_prefix}:#{username}"

    data = 
      _id        : key
      name       : username
      type       : 'user'
      roles      : []
      password   : password
      $owner     : @owner
      database   : @db()

    requestPromise = @hoodie.request 'PUT', "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify data
      contentType : 'application/json'
      
    delaydSignIn = =>
      window.setTimeout ( =>
        @signIn(username, password).then defer.resolve, handleError
      ), 300

    handleSucces = (response) =>
      @hoodie.trigger 'account:signup', username
      @_doc._rev = response.rev
      delaydSignIn()
    
    handleError = (error) =>
      if error.error is 'unconfirmed'
        # It might take a bit until the account has been confirmed
        delaydSignIn()
      else
        defer.reject arguments...

    requestPromise.then handleSucces, defer.reject
      
    return defer.promise()


  # ## sign in with username & password
  #
  # uses standard CouchDB API to create a new user session (POST /_session).
  # Besides the standard sign in we also check if the account has been confirmed
  # (roles include "confirmed" role).
  #
  signIn : (username, password = '') ->
    defer = @hoodie.defer()

    requestPromise = @hoodie.request 'POST', '/_session', 
      data: 
        name      : username
        password  : password
        
    handleSucces = (response) =>
      unless ~response.roles.indexOf("confirmed")
        return defer.reject error: "unconfirmed", reason: "account has not been confirmed yet"

      @owner = response.roles.shift()
      @hoodie.my.config.set '_account.owner', @owner

      @hoodie.trigger 'account:signin', username
      @fetch()
      defer.resolve username, response
    
    requestPromise.then handleSucces, defer.reject
    
    return defer.promise()

  # alias
  login: @::signIn


  # ## change password
  #
  # NOTE: simple implementation, currentPassword is ignored.
  #
  changePassword : (currentPassword = '', newPassword) ->
    defer = @hoodie.defer()
    unless @username
      defer.reject error: "unauthenticated", reason: "not logged in"
      return defer.promise()
    
    key = "#{@_prefix}:#{@username}"
    
    data = $.extend {}, @_doc
    delete data.salt
    delete data.passwordSha
    data.password = newPassword
    
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
  # uses standard CouchDB API to destroy a user session (DELETE /_session)
  #
  # TODO: handle errors
  signOut: ->
    @hoodie.request 'DELETE', '/_session', 
      success : => @hoodie.trigger 'account:signout'

  # alias
  logout: @::signOut
  
  
  # ## On
  #
  # alias for `hoodie.on`
  on : (event, cb) -> @hoodie.on "account:#{event}", cb
  
  
  # ## db
  #
  # escape user username (or what ever he uses to sign up)
  # to make it a valid CouchDB database name
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
    "user/#{@owner}"
  
  
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
  
  # CouchDB _users doc
  _doc : {}
  
  #
  _handleSignIn: (@username) =>
    @hoodie.my.config.set '_account.username', @username
    @_authenticated = true
  
  #
  _handleSignOut: =>
    delete @username
    @hoodie.my.config.remove '_account.username'
    @hoodie.my.config.remove '_account.owner'
    @_authenticated = false
