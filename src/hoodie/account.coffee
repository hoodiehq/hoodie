# Hoodie.Account
# ================
#
# tell something smart in here.
#

class Hoodie.Account
  
  # Properties
  # ------------
  username    : undefined

  
  # Constructor
  # ------------
  constructor : (@hoodie) ->
    
    # handle session
    @username = @hoodie.my.config.get '_account.username'
    @owner    = @hoodie.my.config.get '_account.owner'

    # the owner hash gets stored in every object created by the user.
    # Make sure we have one.
    unless @owner
      @owner = @hoodie.my.store.uuid()
      @hoodie.my.config.set '_account.owner', @owner
    
    # authenticate on next tick
    # window.setTimeout @authenticate

    # is there a pending password reset?
    @_checkPasswordResetStatus()
  
  
  # Authenticate
  # --------------

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
    
    
  # sign up with username & password
  # ----------------------------------

  # uses standard CouchDB API to create a new document in _users db.
  # The backend will automatically create a userDB based on the username
  # address and approve the account by adding a "confirmed" role to the
  # user doc. The account confirmation might take a while, so we keep trying
  # to sign in with a 300ms timeout.
  #
  signUp : (username, password = '') ->
    defer = @hoodie.defer()
    
    if @hasAnonymousAccount()
      currentPassword = @hoodie.my.config.get '_account.anonymousPassword'
      @_changeUserNameAndPassword(currentPassword, username, password)
      .fail(defer.reject)
      .done => 
        @hoodie.my.config.remove '_account.anonymousPassword'
        defer.resolve arguments...

    else
      key  = "#{@_prefix}:#{username}"
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
          @signIn(username, password).then defer.resolve, handleSignInError
        ), 300

      handleSignUpSucces = (response) =>
        @hoodie.trigger 'account:signup', username
        @_doc._rev = response.rev
        delaydSignIn()
      
      handleSignInError = (error) =>
        if error.error is 'unconfirmed'
          # It might take a bit until the account has been confirmed
          delaydSignIn()
        else
          defer.reject arguments...

      requestPromise.then handleSignUpSucces, defer.reject
        
    return defer.promise()

  
  # anonymous sign up
  # -------------------

  # If the user did not sign up himself yet, but data needs to be transfered
  # to the couch, e.g. to send an email or to share data, the anonymousSignUp
  # method can be used. It generates a random password and stores it locally
  # in the browser.
  #
  # If the user signes up for real later, we change his username and password
  # internally instead of creating another user. 
  #
  anonymousSignUp: ->
    password = @hoodie.my.store.uuid(10)
    username = "anonymous/#{@owner}"
    @signUp username, password
    @hoodie.my.config.set '_account.anonymousPassword', password


  # hasAnonymousAccount
  # ---------------------
  
  #
  hasAnonymousAccount: ->
    @hoodie.my.config.get('_account.anonymousPassword')?

  # sign in with username & password
  # ----------------------------------

  # uses standard CouchDB API to create a new user session (POST /_session).
  # Besides the standard sign in we also check if the account has been confirmed
  # (roles include "confirmed" role).
  #
  signIn : (username, password = '') ->
    defer = @hoodie.defer()
        
    handleSucces = (response) =>

      # TODO:
      # handle errors. If an error occurs, the workers stores it in
      # the _users doc's $error attribute. We have to fetch the _users
      # doc and check if it has an error at this point. Otherwise
      # it will keep trying to sign in, which doesn't make any sense.
      #
      # IDEA: we add a role "error", so that we don't need to fetch
      #       the _users doc to find out if there is an error
      unless ~response.roles.indexOf("confirmed")
        return defer.reject error: "unconfirmed", reason: "account has not been confirmed yet"

      unless @owner
        @owner = response.roles.shift()
        @hoodie.my.config.set '_account.owner', @owner

      @hoodie.trigger 'account:signin', username
      @fetch()
      defer.resolve username, response

    requestPromise = @hoodie.request 'POST', '/_session', 
      data: 
        name      : username
        password  : password

    requestPromise.then handleSucces, defer.reject

    return defer.promise()

  # alias
  login: @::signIn


  # sign out 
  # ---------

  # uses standard CouchDB API to destroy a user session (DELETE /_session)
  #
  # TODO: handle errors
  signOut: ->
    @hoodie.my.remote.disconnect()
    @hoodie.request 'DELETE', '/_session', 
      success : => @hoodie.trigger 'account:signout'

  # alias
  logout: @::signOut
  
  
  # On
  # ---

  # alias for `hoodie.on`
  on : (event, cb) -> @hoodie.on "account:#{event}", cb
  
  
  # db
  # ----

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
  
  
  # fetch
  # -------

  # fetches _users doc from CouchDB and caches it in _doc
  fetch : =>
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
    

  # change password
  # -----------------

  # Note: the hoodie API requires the currentPassword for security reasons,
  # but couchDb doesn't require it for a password change, so it's ignored
  # in this implementation of the hoodie API.
  changePassword : (currentPassword, newPassword) ->
    defer = @hoodie.defer()
    unless @username
      defer.reject error: "unauthenticated", reason: "not logged in"
      return defer.promise()
    
    key = "#{@_prefix}:#{@username}"
    
    data = $.extend {}, @_doc
    delete data.salt
    delete data.password_sha
    data.password = newPassword
    
    @hoodie.request 'PUT',  "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify data
      contentType : "application/json"
      success     : (response) =>
        window.setTimeout ( => 
          @hoodie.my.remote.disconnect()
          @signIn(@username, newPassword).then defer.resolve, defer.reject
        ), 1000
        
      error       : (xhr) ->
        try
          error = JSON.parse(xhr.responseText)
        catch e
          error = error: xhr.responseText or "unknown"
          
        defer.reject(error)


  # reset password
  # ----------------

  # This is kind of a hack. We need to create an object anonymously
  # that is not exposed to others. The only CouchDB API othering such 
  # functionality is the _users database.
  # 
  # So we actualy sign up a new couchDB user with some special attributes.
  # It will be picked up by the password reset worker and destroyed
  # once the password was resetted.
  resetPassword : (username) ->
    defer = @hoodie.defer()

    if resetPasswordId = @hoodie.my.config.get '_account.resetPasswordId'
      return @_checkPasswordResetStatus()
      
    resetPasswordId = "#{username}/#{@hoodie.my.store.uuid()}"
    @hoodie.my.config.set '_account.resetPasswordId', resetPasswordId
    
    key = "#{@_prefix}:$passwordReset/#{resetPasswordId}"
    data = 
      _id       : key
      name      : "$passwordReset/#{resetPasswordId}"
      type      : 'user'
      password  : resetPasswordId
      createdAt : new Date
      updatedAt : new Date
    
    @hoodie.request 'PUT',  "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify data
      contentType : "application/json"
      success     : (response) =>
        defer.resolve()
        @_checkPasswordResetStatus()
        
      error       : (xhr) ->
        try
          error = JSON.parse(xhr.responseText)
        catch e
          error = error: xhr.responseText or "unknown"
        
        defer.reject(error)

    return defer.promise()


  # change username
  # -----------------

  # Note: the hoodie API requires the current password for security reasons,
  # but technically we cannot (yet) prevent the user to change the username 
  # without knowing the current password, so it's not impulemented in the current
  # implementation of the hoodie API.
  #
  # But the current password is needed to login with the new username.
  changeUsername : (currentPassword, newUsername) ->
    @_changeUserNameAndPassword(currentPassword, newUsername)


  # destroy
  # ---------

  # destroys a user' account  
  destroy : ->
    @hoodie.my.remote.disconnect()
    @fetch().pipe =>
      key = "#{@_prefix}:#{@username}"
      @_doc._deleted = true
      @hoodie.request 'PUT', "/_users/#{encodeURIComponent key}",
        data        : JSON.stringify @_doc
        contentType : 'application/json'


  # PRIVATE
  # ---------
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
    @hoodie.my.config.clear()
    @_authenticated = false

  #
  # check for the status of a password reset. It might take
  # a while until the password reset worker picks up the job
  # and updates it
  #
  # If a password reset request was successful, the $passwordRequest
  # doc gets removed from _users by the worker, therefore a 401 is
  # what we are waiting for.
  #
  # Once called, it continues to request the status update with a
  # 1s timeout.
  #
  _checkPasswordResetStatus : =>
    defer = @hoodie.defer()
    resetPasswordId = @hoodie.my.config.get '_account.resetPasswordId'

    unless resetPasswordId
      return defer.reject(error: "missing").promise()

    defer.done => 
      @hoodie.my.config.remove '_account.resetPasswordId'
      @hoodie.trigger 'account:password_reset:success'
    defer.fail (error) =>
      if error.error is 'pending'
        window.setTimeout @_checkPasswordResetStatus, 1000
        return

      @hoodie.my.config.remove '_account.resetPasswordId'
      @hoodie.trigger 'account:password_reset:error'
    
    username  = "$passwordReset/#{resetPasswordId}"
    hash      = btoa "#{username}:#{resetPasswordId}"
    auth      = "Basic #{hash}"

    @hoodie.request 'GET',  "/_users/#{encodeURIComponent "#{@_prefix}:#{username}"}",
      headers     :
        Authorization : auth
      # beforeSend: (req) ->
      #  req.setRequestHeader 'Authorization', auth
      success     : (response) =>
        if response.$error
          return defer.reject error: response.$error

        defer.reject error: 'pending'
        
      error       : (xhr) ->
        # document deleted, therefore invalid authorization
        if xhr.status is 401
          return defer.resolve()

        try
          error = JSON.parse(xhr.responseText)
        catch e
          error = error: xhr.responseText or "unknown"
        
        defer.reject(error)

    return defer.promise()

  #
  #
  #
  _changeUserNameAndPassword: (currentPassword, newUsername, newPassword) ->
    defer = @hoodie.defer()
    
    @authenticate().pipe =>
      key = "#{@_prefix}:#{@username}"

      data = $.extend {}, @_doc
      data.$newUsername = newUsername

      if newPassword
        delete data.salt
        delete data.password_sha
        data.password = newPassword

      reqPromise = @hoodie.request 'PUT', "/_users/#{encodeURIComponent key}",
        data        : JSON.stringify data
        contentType : 'application/json'

      reqPromise.fail defer.reject
      reqPromise.done =>
        @hoodie.my.remote.disconnect()
        window.setTimeout ( =>
          @signIn(newUsername, newPassword or currentPassword).then defer.resolve, defer.reject
        ), 1000

    return defer.promise()
