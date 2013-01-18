# RemoteStore
# ============

# Connection to a remote Couch Database.
#
# this.store API
# ----------------
#
# object loading / updating / deleting
#
# * store.find(type, id)
# * store.findAll(type )
# * store.add(type, object)
# * store.save(type, id, object)
# * store.update(new_properties )
# * store.updateAll( type, new_properties)
# * store.remove(type, id)
# * store.removeAll(type)
#
# custom requests
#
# * request(view, params)
# * get(view, params)
# * post(view, params)
#
# synchronization
#
# * connect()
# * disconnect()
# * pull()
# * push()
# * sync()
#
# event binding
#
# * on(event, callback)
#
class Hoodie.Remote


  # properties
  # ------------
  
  # name  

  # the name of the RemoteStore is the name of the
  # CouchDB database and is also used to prefix 
  # triggered events
  name : undefined
  
  # sync  

  # if set to true, updates will be continuously pulled
  # and pushed. Alternatively, `sync` can be set to
  # `pull: true` or `push: true`.
  _sync : false

  # docPrefix

  # prefix of docs in CouchDB Database, e.g. all docs
  # in public user stores are prefixed by '$public'
  prefix : ''


  # Constructor 
  # -------------
  
  # sets name (think: namespace) and some other options
  constructor : (@hoodie, options = {}) ->
    if options.name?
      @name = options.name     
      @prefix = @name
      
    @prefix = options.prefix if options.prefix?

    @_sync   = options.sync   if options.sync
    @store   = new Hoodie.RemoteStore @hoodie, this

    # NOTE: 
    # Due to a bug in Chrome (I guess), the loader won't disappear
    # when the page is loaded, when we start a long poll request
    # before the page loaded.
    # On the other side, we do not want to wait for to the page
    # and all its assets to be loaded before we start loading
    # our data. 
    # A good way to fix it would be a special `bootstrap` method,
    # that would all docs with a normal GET /_all_docs request,
    # after that it would start with the GET /_changes requests,
    # starting with the current seq number of the database.
    @startSyncing() if @isContinuouslySyncing()

  
  # request
  # ---------
  
  # wrapper for hoodie.request, with some store specific defaults
  # and a prefixed path
  request : (type, path, options = {}) ->
    path = "/#{encodeURIComponent @name}#{path}" if @name

    options.contentType or= 'application/json'
    if type is 'POST' or type is 'PUT'
      options.dataType    or= 'json'
      options.processData or= false
      options.data = JSON.stringify options.data

    @hoodie.request type, path, options


  # get
  # -----
  
  # send a GET request to the named view
  get : (view_name, params) ->
    console.log ".get() not yet implemented", arguments...
  
  
  # post
  # ------
  
  # sends a POST request to the specified updated_function
  post : (update_function_name, params) ->
    console.log ".post() not yet implemented", arguments...



  # synchronization
  # -----------------

  # Connect
  # ---------

  # start syncing
  connect : (options) =>
    @connected = true
    @sync()
  
    
  # Disconnect
  # ------------

  # stop syncing changes from the userDB
  disconnect : =>
    @connected = false
    
    @_pullRequest?.abort()
    @_pushRequest?.abort()
  

  # startSyncing
  # --------------

  # start continuous syncing with current users store
  # 
  startSyncing : =>
    @_sync = true
    @connect()


  # stopSyncing
  # -------------

  # stop continuous syncing with current users store
  # 
  stopSyncing : =>
    @_sync = false


  # isContinuouslyPulling
  # -----------------------

  # returns true if pulling is set to be continous
  isContinuouslyPulling : ->
    @_sync is true or @_sync?.pull is true


  # isContinuouslyPushing
  # -----------------------

  # returns true if pulling is set to be continous
  isContinuouslyPushing : ->
    @_sync is true or @_sync?.push is true


  # isContinuouslySyncing
  # -----------------------

  # returns true if pulling is set to be continous
  isContinuouslySyncing : ->
    @_sync is true


  # getSinceNr
  # ------------

  # returns the sequence number from wich to start to find changes in pull
  #
  getSinceNr : ->
    @_since or 0


  # setSinceNr
  # ------------

  # sets the sequence number from wich to start to find changes in pull
  #
  setSinceNr : (seq) ->
    @_since = seq


  # pull changes
  # --------------

  # a.k.a. make a GET request to CouchDB's `_changes` feed.
  #
  pull : =>
    @_pullRequest = @request 'GET', @_pullUrl()

    if @connected and @isContinuouslyPulling()
      window.clearTimeout @_pullRequestTimeout
      @_pullRequestTimeout = window.setTimeout @_restartPullRequest, 25000 # 25 sec
    
    @_pullRequest.then @_handlePullSuccess, @_handlePullError
    
    
  # push changes
  # --------------

  # Push objects to userDB using the `_bulk_docs` API.
  # If no objects passed, push all changed documents
  push : (docs) =>
    
    return @hoodie.defer().resolve([]).promise() unless docs?.length
      
    docsForRemote = []
    for doc in docs
      docsForRemote.push @store.parseForRemote doc 
    
    @_pushRequest = @request 'POST', "/_bulk_docs"
      data :
        docs      : docsForRemote
        new_edits : false

    # when push is successful, update the local store with the generated _rev numbers
    @_pushRequest.done @_handlePushSuccess(docs, docsForRemote)


  # sync changes
  # --------------

  # pull ... and push ;-)
  sync : (docs) =>
    @push(docs).pipe @pull

  
  # Events
  # --------

  # namespaced alias for `hoodie.on`
  on  : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1#{@name}:$2"
    @hoodie.on  event, cb
  one : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1#{@name}:$2"
    @hoodie.one event, cb
  
  # namespaced alias for `hoodie.trigger`
  trigger : (event, parameters...) -> 
    @hoodie.trigger "#{@name}:#{event}", parameters...
  



  # Private
  # --------------
  
  # ### pull url

  # Depending on whether isContinuouslyPulling() is true, return a longpoll URL or not
  #
  _pullUrl : ->
    since = @getSinceNr()
    if @isContinuouslyPulling() # make a long poll request
      "/_changes?include_docs=true&since=#{since}&heartbeat=10000&feed=longpoll"
    else
      "/_changes?include_docs=true&since=#{since}"
  
  # request gets restarted automaticcally 
  # when aborted (see @_handlePullError)
  _restartPullRequest : => @_pullRequest?.abort()


  # ### pull success handler 

  # handle the incoming changes, then send the next request
  #
  _handlePullSuccess : (response) =>
    @setSinceNr response.last_seq
    @_handlePullResults response.results
    
    @pull() if @connected and @isContinuouslyPulling()
  
  
  # ### pull error handler 

  # when there is a change, trigger event, 
  # then check for another change
  #
  _handlePullError : (xhr, error, resp) =>
    
    return unless @connected

    switch xhr.status
  
      # Session is invalid. User is still login, but needs to reauthenticate
      # before sync can be continued
      when 401
        @trigger 'error:unauthenticated', error
        @disconnect()
      
      # the 404 comes, when the requested DB has been removed
      # or does not exist yet.
      # 
      # BUT: it might also happen that the background workers did
      #      not create a pending database yet. Therefore,
      #      we try it again in 3 seconds
      #
      # TODO: review / rethink that.
      when 404
        window.setTimeout @pull, 3000
      
      # Please server, don't give us these. At least not persistently 
      when 500
        @trigger 'error:server', error
        window.setTimeout @pull, 3000
      
      # usually a 0, which stands for timeout or server not reachable.
      else
        return unless @isContinuouslyPulling()

        if xhr.statusText is 'abort'
          # manual abort after 25sec. restart pulling changes directly when isContinuouslyPulling() is true
          @pull()
        else    
            
          # oops. This might be caused by an unreachable server.
          # Or the server canceled it for what ever reason, e.g.
          # heroku kills the request after ~30s.
          # we'll try again after a 3s timeout
          window.setTimeout @pull, 3000


  # ### handle changes from remote

  # in order to differentiate whether an object from remote should trigger a 'new'
  # or an 'update' event, we store a hash of known objects
  _knownObjects : {}
  _handlePullResults : (changes) =>
    for {doc} in changes
      parsedDoc = @store.parseFromRemote(doc)
      if parsedDoc._deleted
        event = 'remove'
        delete @_knownObjects[doc._id]
      else
        if @_knownObjects[doc._id]
          event = 'update'
        else
          event = 'add'
          @_knownObjects[doc._id] = 1

      @trigger "store:#{event}",                                    parsedDoc
      @trigger "store:#{event}:#{parsedDoc.$type}",                 parsedDoc
      @trigger "store:#{event}:#{parsedDoc.$type}:#{parsedDoc.id}", parsedDoc      
      @trigger "store:change",                                      event, parsedDoc
      @trigger "store:change:#{parsedDoc.$type}",                   event, parsedDoc
      @trigger "store:change:#{parsedDoc.$type}:#{parsedDoc.id}",   event, parsedDoc


  # ### handle push success

  # do nothing by default
  _handlePushSuccess : (docs, pushedDocs) => 