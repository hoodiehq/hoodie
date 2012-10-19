# Hoodie.Account
# ================

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
    @username   = @hoodie.my.config.get '_account.username'
    @ownerHash  = @hoodie.my.config.get '_account.ownerHash'

    # the ownerHash gets stored in every object created by the user.
    # Make sure we have one.
    unless @ownerHash
      @ownerHash = @hoodie.my.store.uuid()
      @hoodie.my.config.set '_account.ownerHash', @ownerHash
    
    # authenticate on next tick
    window.setTimeout @authenticate

    # is there a pending password reset?
    @_checkPasswordResetStatus()
  
  
  # Authenticate
  # --------------

  # Use this method to assure that the user is authenticated:
  # `hoodie.my.account.authenticate().done( doSomething ).fail( handleError )`
  authenticate : =>
    # unless @username
    #   return @hoodie.defer().reject().promise()
      
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
    unless username
      return @hoodie.defer().reject(error: 'username must be set').promise()
      
    if @hasAnonymousAccount()
      return @_upgradeAnonymousAccount username, password

    if @hasAccount()
      return @hoodie.defer().reject(error: 'you have to sign out first').promise()

    options =
      data         : JSON.stringify
        _id        : @_key(username)
        name       : @_userKey(username)
        type       : 'user'
        roles      : []
        password   : password
        ownerHash  : @ownerHash
        database   : @db()
      contentType : 'application/json'

    @hoodie.request('PUT', @_url(username), options)
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
  anonymousSignUp : ->
    password = @hoodie.my.store.uuid(10)
    username = @ownerHash

    @signUp(username, password)
    .pipe(null, @_handleRequestError)
    .done =>
      @hoodie.my.config.set '_account.anonymousPassword', password


  # hasAccount
  # ---------------------
  
  #
  hasAccount : ->
    @username?


  # hasAnonymousAccount
  # ---------------------
  
  #
  hasAnonymousAccount : ->
    @hoodie.my.config.get('_account.anonymousPassword')?


  # sign in with username & password
  # ----------------------------------

  # uses standard CouchDB API to create a new user session (POST /_session).
  # Besides the standard sign in we also check if the account has been confirmed
  # (roles include "confirmed" role).
  #
  signIn : (username, password = '') ->
    options = data: 
                name      : @_userKey(username)
                password  : password

    @hoodie.request('POST', '/_session', options)
    .pipe(@_handleSignInSuccess, @_handleRequestError)

  # alias
  login: @::signIn


  # sign out 
  # ---------

  # uses standard CouchDB API to destroy a user session (DELETE /_session)
  signOut : ->

    unless @hasAccount()
      @_cleanup()
      return

    @hoodie.my.remote.disconnect()
    @hoodie.request('DELETE', '/_session').pipe(@_cleanup, @_handleRequestError)

  # alias
  logout: @::signOut
  
  
  # On
  # ---

  # alias for `hoodie.on`
  on : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1account:$2"
    @hoodie.on event, cb
  
  
  # db
  # ----

  # return name of db
  db : -> "user/#{@ownerHash}"
  
  
  # fetch
  # -------

  # fetches _users doc from CouchDB and caches it in _doc
  fetch : (username = @username) =>
    unless username
      return @hoodie.defer().reject(error: "unauthenticated", reason: "not logged in").promise()
    
    @hoodie.request('GET', @_url(username))
    .pipe(null, @_handleRequestError)
    .done (response) => @_doc = response
    

  # change password
  # -----------------

  # Note: the hoodie API requires the currentPassword for security reasons,
  # but couchDb doesn't require it for a password change, so it's ignored
  # in this implementation of the hoodie API.
  changePassword : (currentPassword, newPassword) ->

    unless @username
      return @hoodie.defer().reject(error: "unauthenticated", reason: "not logged in").promise()

    @hoodie.my.remote.disconnect()
    @fetch().pipe @_sendChangePasswordRequest(currentPassword, newPassword), @_handleRequestError


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
      _id        : key
      name       : "$passwordReset/#{resetPasswordId}"
      type       : 'user'
      roles      : []
      password   : resetPasswordId
      $createdAt : new Date
      $updatedAt : new Date

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

  # destroys a user's account  
  destroy : ->

    unless @hasAccount()
      @_cleanup()
      return

    @fetch()
    .pipe(@_handleFetchBeforeDestroySucces, @_handleRequestError)
    .pipe(@_cleanup)


  # PRIVATE
  # ---------

  # default couchDB user doc prefix
  _prefix : 'org.couchdb.user'
  
  # CouchDB _users doc
  _doc : {}

  # setters
  _setUsername : (@username)  -> @hoodie.my.config.set '_account.username',  @username
  _setOwner    : (@ownerHash) -> @hoodie.my.config.set '_account.ownerHash', @ownerHash

  #
  # handle a successful authentication request.
  # 
  _handleAuthenticateSuccess : (response) =>
    defer = @hoodie.defer()

    if response.userCtx.name
      @_authenticated = true
      @_setUsername response.userCtx.name.replace(/^user(_anonymous)?\//, '')
      @_setOwner    response.userCtx.roles[0]
      defer.resolve @username

    else
      @_authenticated = false
      @hoodie.trigger 'account:error:unauthenticated'
      defer.reject()

    return defer.promise()

  #
  # standard error handling for AJAX requests
  #
  _handleRequestError : (xhr = {}) =>
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
  _handleSignUpSucces : (username, password) =>
    defer = @hoodie.defer()

    (response) =>
      @hoodie.trigger 'account:signup', username
      @_doc._rev = response.rev
      @_delayedSignIn(username, password)

  _delayedSignIn : (username, password) =>
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
  _handleSignInSuccess : (response) =>
    defer    = @hoodie.defer()
    username = response.name.replace(/^user(_anonymous)?\//, '')

    # if an error occured, the userDB worker stores it to the $error attribute
    # and adds the "error" role to the users doc object. If the user has the
    # "error" role, we need to fetch his _users doc to find out what the error
    # is, before we can reject the promise.
    #
    if ~response.roles.indexOf("error")
      @fetch(username)
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
    @_setUsername username
    @_setOwner    response.roles[0]
    @hoodie.trigger 'account:signin', @username

    @fetch()
    defer.resolve(@username, response)
    

  #
  #
  #
  _handleChangePasswordSuccess : (newPassword) ->
    => @signIn(@username, newPassword)

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
    .fail (error) =>
      if error.error is 'pending'
        window.setTimeout @_checkPasswordResetStatus, 1000
        return

      @hoodie.trigger 'account:password_reset:error'

  _handlePasswordResetStatusRequestSuccess : (response) =>
    defer = @hoodie.defer()

    if response.$error
      defer.reject response.$error
    else
      defer.reject error: 'pending'

    return defer.promise()


  _handlePasswordResetStatusRequestError : (xhr) =>
    if xhr.status is 401
      @hoodie.my.config.remove '_account.resetPasswordId'
      @hoodie.trigger 'account:passwordreset'

      return @hoodie.defer().resolve()

    else 
      return @_handleRequestError(xhr)


  #
  # change username and password in 3 steps
  # 
  # 1. assure we have a valid session
  # 2. update _users doc with new username and new password (if provided)
  # 3. sign in with new credentials to create new sesion.
  #
  _changeUsernameAndPassword : (currentPassword, newUsername, newPassword) ->
    @signIn(@username, currentPassword).pipe =>
      @fetch().pipe @_sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword)
  
  #
  # turn an anonymous account into a real account
  #
  _upgradeAnonymousAccount : (username, password) ->
    currentPassword = @hoodie.my.config.get '_account.anonymousPassword'
    @_changeUsernameAndPassword(currentPassword, username, password)
    .done => 
      @hoodie.my.config.remove '_account.anonymousPassword'

  #
  #
  #
  _handleFetchBeforeDestroySucces : =>
    @hoodie.my.remote.disconnect()
    @_doc._deleted = true
    @hoodie.request 'PUT', @_url(),
      data        : JSON.stringify @_doc
      contentType : 'application/json'

  #
  # 
  #
  _cleanup : =>
    delete @username
    delete @_authenticated

    @hoodie.my.config.clear()
    @hoodie.trigger 'account:signout'

    @ownerHash = @hoodie.my.store.uuid()
    @hoodie.my.config.set '_account.ownerHash', @ownerHash
    

  #
  #
  #
  _userKey : (username) ->
    if username is @ownerHash
      "user_anonymous/#{username}"
    else
      "user/#{username}"

  #
  _key : (username = @username) ->
    "#{@_prefix}:#{@_userKey(username)}"

  #
  _url : (username = @username) ->
    "/_users/#{encodeURIComponent @_key(username)}"

  # 
  _sendChangePasswordRequest: (currentPassword, newPassword) =>
    => 
      data = $.extend {}, @_doc
      data.password = newPassword
      delete data.salt
      delete data.password_sha
      options = 
        data        : JSON.stringify data
        contentType : "application/json"

      @hoodie.request('PUT',  @_url(), options)
      .pipe( @_handleChangePasswordSuccess(newPassword), @_handleRequestError )

  # 
  _sendChangeUsernameAndPasswordRequest: (currentPassword, newUsername, newPassword) =>
    =>
      # prepare updated _users doc
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

      @hoodie.request('PUT', @_url(), options)
      .pipe @_handleChangeUsernameAndPasswordRequest(newUsername, newPassword or currentPassword), @_handleRequestError

  # 
  _handleChangeUsernameAndPasswordRequest: (username, password) =>
    =>
      @hoodie.my.remote.disconnect()
      @_delayedSignIn username, password