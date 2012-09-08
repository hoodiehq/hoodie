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
    unless @username
      return @hoodie.defer().reject().promise()
      
    if @_authenticated is true
      return @hoodie.defer().resolve(@username).promise()
      
    if @_authenticated is false
      return @hoodie.defer().reject().promise()
    
    # @_authenticated is undefined
    @hoodie.request('GET', "/_session")
    .pipe @_handleAuthenticateSuccess, @_handleRequestError
    
    
  # sign up with username & password
  # ----------------------------------

  # uses standard CouchDB API to create a new document in _users db.
  # The backend will automatically create a userDB based on the username
  # address and approve the account by adding a "confirmed" role to the
  # user doc. The account confirmation might take a while, so we keep trying
  # to sign in with a 300ms timeout.
  #
  signUp : (username, password = '') ->
    if @hasAnonymousAccount()
      return @_upgradeAnonymousAccount username, password

    key  = "#{@_prefix}:#{username}"

    options =
      data        : JSON.stringify
        _id        : key
        name       : username
        type       : 'user'
        roles      : []
        password   : password
        $owner     : @owner
        database   : @db()
      contentType : 'application/json'

    @hoodie.request('PUT', "/_users/#{encodeURIComponent key}", options)
    .pipe @_handleSignUpSucces(username, password), @_handleRequestError

  
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

    @signUp(username, password)
    .fail(@_handleRequestError)
    .done =>
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
    options = data: 
                name      : username
                password  : password

    @hoodie.request('POST', '/_session', options)
    .pipe(@_handleSignInSuccess)

  # alias
  login: @::signIn


  # sign out 
  # ---------

  # uses standard CouchDB API to destroy a user session (DELETE /_session)
  #
  # TODO: handle errors
  signOut: ->
    @hoodie.my.remote.disconnect()
    @hoodie.request('DELETE', '/_session').pipe(@_handleSignOutSuccess)

  # alias
  logout: @::signOut
  
  
  # On
  # ---

  # alias for `hoodie.on`
  on : (event, cb) -> @hoodie.on "account:#{event}", cb
  
  
  # db
  # ----

  # return name of db
  db : -> "user/#{@owner}"
  
  
  # fetch
  # -------

  # fetches _users doc from CouchDB and caches it in _doc
  fetch : (username = @username) =>
    unless username
      return @hoodie.defer().reject(error: "unauthenticated", reason: "not logged in").promise()
    
    key = "#{@_prefix}:#{username}"
    @hoodie.request('GET', "/_users/#{encodeURIComponent key}")
    .pipe(null, @_handleRequestError)
    .done (response) -> response = @_doc
    

  # change password
  # -----------------

  # Note: the hoodie API requires the currentPassword for security reasons,
  # but couchDb doesn't require it for a password change, so it's ignored
  # in this implementation of the hoodie API.
  changePassword : (currentPassword, newPassword) ->

    unless @username
      return @hoodie.defer().reject(error: "unauthenticated", reason: "not logged in").promise()
    
    key  = "#{@_prefix}:#{@username}"
    data = $.extend {}, @_doc
    data.password = newPassword
    delete data.salt
    delete data.password_sha
    options = 
      data        : JSON.stringify data
      contentType : "application/json"

    @hoodie.my.remote.disconnect()
    @hoodie.request('PUT',  "/_users/#{encodeURIComponent key}", options)
    .pipe( @_handleChangePasswordSuccess(newPassword), @_handleRequestError )


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

    options =
      data        : JSON.stringify data
      contentType : "application/json"
    
    @hoodie.request('PUT',  "/_users/#{encodeURIComponent key}", options)
    .pipe(null, @_handleRequestError)
    .done @_checkPasswordResetStatus


  # change username
  # -----------------

  # Note: the hoodie API requires the current password for security reasons,
  # but technically we cannot (yet) prevent the user to change the username 
  # without knowing the current password, so it's not impulemented in the current
  # implementation of the hoodie API.
  #
  # But the current password is needed to login with the new username.
  changeUsername : (currentPassword, newUsername) ->
    @_changeUsernameAndPassword(currentPassword, newUsername)


  # destroy
  # ---------

  # destroys a user' account  
  destroy : ->
    @fetch().pipe @_handleDestroySucces, @_handleRequestError


  # PRIVATE
  # ---------

  # default couchDB user doc prefix
  _prefix : 'org.couchdb.user'
  
  # CouchDB _users doc
  _doc : {}

  # setters
  _setUsername: (@username) -> @hoodie.my.config.set '_account.username', @username
  _setOwner   : (@owner)    -> @hoodie.my.config.set '_account.owner',    @owner

  #
  # handle a successful authentication request.
  # 
  _handleAuthenticateSuccess: (response) =>
    defer = @hoodie.defer()

    if response.userCtx.name
      @_authenticated = true
      @_setUsername response.userCtx.name
      @_setOwner    response.userCtx.roles[0]
      defer.resolve @username

    else
      @_authenticated = false
      @hoodie.trigger 'account:error:unauthenticated'
      defer.reject()

    return defer.promise()

  _handleRequestError: (xhr = {}) =>
    try
      error = JSON.parse(xhr.responseText)
    catch e
      error = error: xhr.responseText or "unknown"
      
    @hoodie.defer().reject(error).promise()
  
  # 
  # handle response of a successful signUp request. 
  # Response looks like:
  #
  #     {
  #         "ok": true,
  #         "id": "org.couchdb.user:furz",
  #         "rev": "1-e8747d9ae9776706da92810b1baa4248"
  #     }
  #
  _handleSignUpSucces: (username, password) =>
    defer = @hoodie.defer()

    (response) =>
      @hoodie.trigger 'account:signup', username
      @_doc._rev = response.rev
      @_delayedSignIn(username, password)

  _delayedSignIn: (username, password) =>
    defer = @hoodie.defer()
    window.setTimeout ( =>
      promise = @signIn(username, password)
      promise.done(defer.resolve)
      promise.fail (error) =>
        if error.error is 'unconfirmed'
          # It might take a bit until the account has been confirmed
          @_delayedSignIn(username, password)
        else
          defer.reject arguments...
    ), 300

    return defer.promise()

  #
  # handle a successful sign in to couchDB.
  # Response looks like:
  #
  #     {
  #         "ok": true,
  #         "name": "test1",
  #         "roles": [
  #             "mvu85hy",
  #             "confirmed"
  #         ]
  #     }
  #
  _handleSignInSuccess: (response) =>
    defer = @hoodie.defer()

    # if an error occured, the userDB worker stores it to the $error attribute
    # and adds the "error" role to the users doc object. If the user has the
    # "error" role, we need to fetch his _users doc to find out what the error
    # is, before we can reject the promise.
    #
    if ~response.roles.indexOf("error")
      @fetch(response.name)
      .fail(defer.reject)
      .done =>
        defer.reject error: "error", reason: @_doc.$error
      return defer.promise()

    # When the userDB worker created the database for the user and everthing
    # worked out, it adds the role "confirmed" to the user. If the role is
    # not present yet, it might be that the worker didn't pick up the the 
    # user doc yet, or there was an error. In this cases, we reject the promise
    # with an "uncofirmed error"
    unless ~response.roles.indexOf("confirmed")
      return defer.reject error: "unconfirmed", reason: "account has not been confirmed yet"
    
    @_authenticated = true
    @_setUsername response.name
    @_setOwner    response.roles[0]
    @hoodie.trigger 'account:signin', @username

    @fetch()
    defer.resolve(@username, response)
    

  #
  #
  #
  _handleChangePasswordSuccess: (newPassword) ->
    => @signIn(@username, newPassword)

  #
  #
  #
  _handleSignOutSuccess: =>
    delete @username
    delete @owner
    @hoodie.my.config.clear()
    @_authenticated = false
    @hoodie.trigger 'account:signout'

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

    # reject if there is no pending password reset request
    resetPasswordId = @hoodie.my.config.get '_account.resetPasswordId'
    unless resetPasswordId
      return @hoodie.defer().reject(error: "missing").promise()
      
    # send request to check status of password reset
    username  = "$passwordReset/#{resetPasswordId}"
    url       = "/_users/#{encodeURIComponent "#{@_prefix}:#{username}"}"
    hash      = btoa "#{username}:#{resetPasswordId}"
    options   =
      headers:
        Authorization : "Basic #{hash}"

    @hoodie.request('GET', url, options)
    .pipe(@_handlePasswordResetStatusRequestSuccess, @_handlePasswordResetStatusRequestError)
    .fail =>
      if error.error is 'pending'
        window.setTimeout @_checkPasswordResetStatus, 1000
        return

      @hoodie.trigger 'account:password_reset:error'

  _handlePasswordResetStatusRequestSuccess : =>
    defer = @hoodie.defer()

    if response.$error
      defer.reject error: response.$error
    else
      defer.reject error: 'pending'

    return defer.promise()


  _handlePasswordResetStatusRequestError : (xhr) =>
    if xhr.status is 401
      @hoodie.defer().resolve()

      @hoodie.my.config.remove '_account.resetPasswordId'
      @hoodie.trigger 'account:password_reset:success'
    else
      @_handleRequestError(xhr)


  #
  # change username and password in 3 steps
  # 
  # 1. assure we have a valid session
  # 2. update _users doc with new username and new password (if provided)
  # 3. sign in with new credentials to create new sesion.
  #
  _changeUsernameAndPassword: (currentPassword, newUsername, newPassword) ->
    @authenticate().pipe =>

      # prepare updated _users doc
      key = "#{@_prefix}:#{@username}"
      data = $.extend {}, @_doc
      data.$newUsername = newUsername

      # trigger password update when newPassword set
      if newPassword
        delete data.salt
        delete data.password_sha
        data.password = newPassword

      options =
        data        : JSON.stringify data
        contentType : 'application/json'

      @hoodie.request('PUT', "/_users/#{encodeURIComponent key}", options)
      .pipe =>
        @hoodie.my.remote.disconnect()
        @_delayedSignIn newUsername, newPassword or currentPassword
  
  #
  # turn an anonymous account into a real account
  #
  _upgradeAnonymousAccount: (username, password) ->
    currentPassword = @hoodie.my.config.get '_account.anonymousPassword'
    @_changeUsernameAndPassword(currentPassword, username, password)
    .done => 
      @hoodie.my.config.remove '_account.anonymousPassword'

  #
  #
  #
  _handleDestroySucces: =>
    @hoodie.my.remote.disconnect()
    key = "#{@_prefix}:#{@username}"
    @_doc._deleted = true
    @hoodie.request 'PUT', "/_users/#{encodeURIComponent key}",
      data        : JSON.stringify @_doc
      contentType : 'application/json'