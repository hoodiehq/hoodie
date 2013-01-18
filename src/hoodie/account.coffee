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
    @username   = @hoodie.config.get '_account.username'
    @ownerHash  = @hoodie.config.get '_account.ownerHash'

    # the ownerHash gets stored in every object created by the user.
    # Make sure we have one.
    unless @ownerHash
      @_setOwner @hoodie.uuid()
    
    # authenticate on next tick
    window.setTimeout @authenticate

    # is there a pending password reset?
    @_checkPasswordResetStatus()
  
  
  # Authenticate
  # --------------

  # Use this method to assure that the user is authenticated:
  # `hoodie.account.authenticate().done( doSomething ).fail( handleError )`
  authenticate : =>
    unless @username
      @_sendSignOutRequest()
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
    password = @hoodie.uuid(10)
    username = @ownerHash

    @signUp(username, password)
    .pipe(null, @_handleRequestError)
    .done =>
      @hoodie.config.set '_account.anonymousPassword', password
      @trigger 'signup:anonymous', username


  # hasAccount
  # ---------------------
  
  #
  hasAccount : ->
    @username?


  # hasAnonymousAccount
  # ---------------------
  
  #
  hasAnonymousAccount : ->
    @hoodie.config.get('_account.anonymousPassword')?


  # sign in with username & password
  # ----------------------------------

  # uses standard CouchDB API to create a new user session (POST /_session).
  # Besides the standard sign in we also check if the account has been confirmed
  # (roles include "confirmed" role).
  # 
  # NOTE: When signing in, all local data gets cleared beforehand (with a signOut). 
  #       Otherwise data that has been created beforehand (authenticated with 
  #       another user account or anonymously) would be merged into the user 
  #       account that signs in.
  signIn : (username, password = '') ->
    @signOut().pipe => @_sendSignInRequest(username, password)


  # sign out 
  # ---------

  # uses standard CouchDB API to invalidate a user session (DELETE /_session)
  signOut : ->

    return @_cleanup() unless @hasAccount()

    @hoodie.remote.disconnect()
    @_sendSignOutRequest().pipe(@_cleanup)
  
  
  # On
  # ---

  # shortcut for `hoodie.on`
  on : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1account:$2"
    @hoodie.on event, cb


  # Trigger
  # ---

  # shortcut for `hoodie.trigger`
  trigger : (event, parameters...) -> 
    @hoodie.trigger "account:#{event}", parameters...
  
  
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
    
    @_withSingleRequest 'fetch', =>
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

    @hoodie.remote.disconnect()
    @fetch().pipe @_sendChangeUsernameAndPasswordRequest(currentPassword, null, newPassword), @_handleRequestError


  # reset password
  # ----------------

  # This is kind of a hack. We need to create an object anonymously
  # that is not exposed to others. The only CouchDB API othering such 
  # functionality is the _users database.
  # 
  # So we actualy sign up a new couchDB user with some special attributes.
  # It will be picked up by the password reset worker and removeed
  # once the password was resetted.
  resetPassword : (username) ->
    if resetPasswordId = @hoodie.config.get '_account.resetPasswordId'
      return @_checkPasswordResetStatus()
      
    resetPasswordId = "#{username}/#{@hoodie.uuid()}"
    @hoodie.config.set '_account.resetPasswordId', resetPasswordId
    
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
    
    @_withPreviousRequestsAborted 'resetPassword', =>
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
      return @_cleanup()

    @fetch()
    .pipe(@_handleFetchBeforeDestroySucces, @_handleRequestError)
    .pipe(@_cleanup)


  # PRIVATE
  # ---------

  # default couchDB user doc prefix
  _prefix : 'org.couchdb.user'
  
  # CouchDB _users doc
  _doc : {}

  # map of requestPromises. We maintain this list to avoid sending
  # the same requests several times.
  _requests : {}

  # setters
  _setUsername : (@username)  -> 
    @hoodie.config.set '_account.username',  @username

  _setOwner    : (@ownerHash) -> 
    # `ownerHash` is stored with every new object in the $createdBy
    # attribute. It does not get changed once it's set. That's why
    # we have to force it to be change for the `$config/hoodie` object.
    @hoodie.config.set '$createdBy', @ownerHash
    @hoodie.config.set '_account.ownerHash', @ownerHash

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
      @trigger 'error:unauthenticated'
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
  #         "id": "org.couchdb.user:joe",
  #         "rev": "1-e8747d9ae9776706da92810b1baa4248"
  #     }
  #
  _handleSignUpSucces : (username, password) =>
    defer = @hoodie.defer()

    (response) =>
      @trigger 'signup', username
      @_doc._rev = response.rev
      @_delayedSignIn(username, password)

  _delayedSignIn : (username, password) =>
    defer = @hoodie.defer()
    window.setTimeout ( =>
      promise = @_sendSignInRequest(username, password)
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
  # parse a successful sign in response from couchDB.
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
  # we want to turn it into "test1", "mvu85hy" or reject the promise
  # in case an error occured ("roles" array contains "error")
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
    @_setOwner    response.roles[0]
    @_setUsername username

    if @hasAnonymousAccount()
      @trigger 'signin:anonymous', username
    else
      @trigger 'signin', username

    @fetch()
    defer.resolve(@username, response.roles[0])

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
    resetPasswordId = @hoodie.config.get '_account.resetPasswordId'
    unless resetPasswordId
      return @hoodie.defer().reject(error: "missing").promise()
      
    # send request to check status of password reset
    username  = "$passwordReset/#{resetPasswordId}"
    url       = "/_users/#{encodeURIComponent "#{@_prefix}:#{username}"}"
    hash      = btoa "#{username}:#{resetPasswordId}"
    options   =
      headers:
        Authorization : "Basic #{hash}"

    @_withPreviousRequestsAborted 'passwordResetStatus', =>
      @hoodie.request('GET', url, options)
      .pipe(@_handlePasswordResetStatusRequestSuccess, @_handlePasswordResetStatusRequestError)
      .fail (error) =>
        if error.error is 'pending'
          window.setTimeout @_checkPasswordResetStatus, 1000
          return

        @trigger 'password_reset:error'

  # 
  # If the request was successful there might have occured an
  # error, which the worker stored in the special $error attribute. 
  # If that happens, we return a rejected promise with the $error,
  # error. Otherwise reject the promise with a 'pending' error,
  # as we are not waiting for a success full response, but a 401 
  # error, indicating that our password was changed and our
  # curren session has been invalidated
  _handlePasswordResetStatusRequestSuccess : (response) =>
    defer = @hoodie.defer()

    if response.$error
      defer.reject response.$error
    else
      defer.reject error: 'pending'

    return defer.promise()

  # 
  # If the error is a 401, it's exactly what we've been waiting for.
  # In this case we resolve the promise.
  _handlePasswordResetStatusRequestError : (xhr) =>
    if xhr.status is 401
      @hoodie.config.remove '_account.resetPasswordId'
      @trigger 'passwordreset'

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
    @_sendSignInRequest(@username, currentPassword).pipe =>
      @fetch().pipe @_sendChangeUsernameAndPasswordRequest(currentPassword, newUsername, newPassword)
  
  #
  # turn an anonymous account into a real account
  #
  _upgradeAnonymousAccount : (username, password) ->
    currentPassword = @hoodie.config.get '_account.anonymousPassword'
    @_changeUsernameAndPassword(currentPassword, username, password)
    .done => 
      @trigger 'signup', username
      @hoodie.config.remove '_account.anonymousPassword'

  #
  # we now can be sure that we fetched the latest _users doc, so we can update it
  # without a potential conflict error.
  _handleFetchBeforeDestroySucces : =>
    @hoodie.remote.disconnect()
    @_doc._deleted = true

    @_withPreviousRequestsAborted 'updateUsersDoc', =>
      @hoodie.request 'PUT', @_url(),
        data        : JSON.stringify @_doc
        contentType : 'application/json'

  #
  # remove everythng form the current account, so a new account can be initiated.
  _cleanup : =>
    delete @username
    delete @_authenticated

    @hoodie.config.clear()
    @trigger 'signout'

    @_setOwner @hoodie.uuid()

    @hoodie.defer().resolve().promise()
    

  #
  # depending on wether the user signedUp manually or has been signed up anonymously
  # the prefix in the CouchDB _users doc differentiates. 
  _userKey : (username) ->
    if username is @ownerHash
      "user_anonymous/#{username}"
    else
      "user/#{username}"

  #
  # turn a username into a valid _users doc._id
  _key : (username = @username) ->
    "#{@_prefix}:#{@_userKey(username)}"

  #
  # get URL of my _users doc
  _url : (username) ->
    "/_users/#{encodeURIComponent @_key(username)}"

  # 
  # update my _users doc.
  # 
  # If a new username has been passed, we set the special attribut $newUsername.
  # This will let the username change worker create create a new _users doc for 
  # the new username and remove the current one
  # 
  # If a new password has been passed, salt and password_sha get removed
  # from _users doc and add the password in clear text. CouchDB will replace it with
  # according password_sha and a new salt server side
  _sendChangeUsernameAndPasswordRequest: (currentPassword, newUsername, newPassword) =>
    =>
      # prepare updated _users doc
      data = $.extend {}, @_doc
      data.$newUsername = newUsername if newUsername

      # trigger password update when newPassword set
      if newPassword?
        delete data.salt
        delete data.password_sha
        data.password = newPassword

      options =
        data        : JSON.stringify data
        contentType : 'application/json'

      @_withPreviousRequestsAborted 'updateUsersDoc', =>
        @hoodie.request('PUT', @_url(), options)
        .pipe @_handleChangeUsernameAndPasswordRequest(newUsername, newPassword or currentPassword), @_handleRequestError

  # 
  # depending on whether a newUsername has been passed, we can sign in right away
  # or have to use the delayed sign in to give the username change worker some time
  _handleChangeUsernameAndPasswordRequest: (newUsername, newPassword) =>
    =>
      @hoodie.remote.disconnect()
      if newUsername
        @_delayedSignIn newUsername, newPassword
      else
        @signIn(@username, newPassword)


  # 
  # make sure that the same request doesn't get sent twice
  # by cancelling the previous one.
  _withPreviousRequestsAborted: (name, requestFunction) ->
    @_requests[name]?.abort?()
    @_requests[name] = requestFunction()

  # 
  # if there is a pending request, return its promise instead
  # of sending another request
  _withSingleRequest: (name, requestFunction) ->
    return @_requests[name] if @_requests[name]?.state?() is 'pending'
    @_requests[name] = requestFunction()
  
  # 
  _sendSignOutRequest: ->
    @_withSingleRequest 'signOut', =>
      @hoodie.request('DELETE', '/_session').pipe(null, @_handleRequestError)

  # 
  # the sign in request that starts a CouchDB session if
  # it succeeds. We separated the actual sign in request from
  # the signIn method, as the latter also runs signOut intenrtally
  # to clean up local data before starting a new session. But as
  # other methods like signUp or changePassword do also need to
  # sign in the user (again), these need to send the sign in 
  # request but without a signOut beforehand, as the user remains
  # the same.
  _sendSignInRequest: (username, password) ->
    options = data: 
                name      : @_userKey(username)
                password  : password

    @_withPreviousRequestsAborted 'signIn', =>
      promise = @hoodie.request('POST', '/_session', options)
      promise.pipe(@_handleSignInSuccess, @_handleRequestError)