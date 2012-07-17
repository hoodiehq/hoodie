# RemoteStore
# ============

# Connection to Couch Database
#
# API
# -----
#
# object loading / updating / deleting
#
# * load(type, id)
# * loadAll(type )
# * create(type, object)
# * save(type, id, object)
# * update(new_properties )
# * updateAll( type, new_properties)
# * delete(type, id)
# * deleteAll(type)
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
class Hoodie.RemoteStore

  # ## properties
  
  # sync  

  # if set to true, updates will be continuously pulled
  # and pushed. Alternatively, `_sync` can be set to
  # `pull: true` or `push: true`.
  _sync: false


  # ## Constructor 
  
  # sets basePath (think: namespace) and some other options
  constructor : (@hoodie, options = {}) ->
    @basePath = options.basePath or ''
    @_sync    = options.sync      if options.sync



  # object loading / updating / deleting
  # --------------------------------------

  
  # ## load
  
  # load one object
  load: (type, id) ->
    path = "/" + encodeURIComponent "#{type}/#{id}"
    @request "GET", path

  
  # ## loadAll
  
  # load all objects, can be filetered by a type
  loadAll: (type) ->
    defer = @hoodie.defer()
    path = "/_all_docs"
    if type
      path = "#{path}?startkey=\"#{type}\"&endkey=\"#{type}0\""

    promise = @request "GET", path
    promise.fail defer.reject
    promise.done (response) ->
      defer.resolve response.rows

    return defer.promise()
  

  # ## create
  
  # create a new object
  create: (type, object) ->
    @save type, undefined, object

  
  # ## save
  
  # save a new object. If it existed before, all properties
  # will be overwritten 
  save: (type, id, object) ->
    console.log ".save() not yet implemented", arguments...

  
  # ## update
  
  # update an existing object
  update: (new_properties) ->
    console.log ".update() not yet implemented", arguments...

  
  # ## updateAll
  
  # update all existing objects, can be filetered by type
  updateAll: (type, new_properties) ->
    console.log ".updateAll() not yet implemented", arguments...

  
  # ## delete
  
  # delete one object
  delete: (type, id) ->
    console.log ".delete() not yet implemented", arguments...

  
  # ## deleteAll
  
  # delete all objects, can be filtered by type
  deleteAll: (type) ->
    console.log ".deleteAll() not yet implemented", arguments...



  # custom requests
  # -----------------

  
  # ## request
  
  # wrapper for hoodie.request, with some store specific defaults
  # and a prefixed path
  request: (type, path, options = {}) ->
    path = @basePath + path

    options.contentType or= 'application/json'
    if type is 'POST'
      options.dataType    or= 'json'
      options.processData or= false

    @hoodie.request type, path, options

  # ## get
  
  # send a GET request to the named view
  get: (view_name, params) ->
    console.log ".get() not yet implemented", arguments...
  
  
  # ## post
  
  # sends a POST request to the specified updated_function
  post: (update_function_name, params) ->
    console.log ".post() not yet implemented", arguments...



  # synchronization
  # -----------------

  # ## Connect

  # start syncing
  connect : =>
    @connected = true
    @sync()
  
    
  # ## Disconnect

  # stop syncing changes from the userDB
  disconnect : =>
    @connected = false
    
    # binding comes from @sync
    @hoodie.unbind 'store:dirty:idle',   @push
    
    @_pullRequest?.abort()
    @_pushRequest?.abort()


  # ## isContinuouslyPulling

  # returns true if pulling is set to be continous
  isContinuouslyPulling: ->
    @_sync is true or @_sync?.pull is true

  # ## isContinuouslyPushing

  # returns true if pulling is set to be continous
  isContinuouslyPushing: ->
    @_sync is true or @_sync?.push is true

  # ## isContinuouslySyncing

  # returns true if pulling is set to be continous
  isContinuouslySyncing: ->
    @_sync is true

  # ## getSinceNr

  # returns the sequence number from wich to start to load changes in pull
  #
  getSinceNr: ->
    @_since or 0

  # ## setSinceNr

  # sets the sequence number from wich to start to load changes in pull
  #
  setSinceNr: (seq) ->
    @_since = seq


  # ## pull changes

  # a.k.a. make a GET request to CouchDB's `_changes` feed.
  #
  pull : =>
    @_pullRequest = @request 'GET', @_pullUrl()

    if @connected and @isContinuouslyPulling()
      window.clearTimeout @_pullRequestTimeout
      @_pullRequestTimeout = window.setTimeout @_restartPullRequest, 25000 # 25 sec
    
    @_pullRequest.then @_handlePullSuccess, @_handlePullError
    
    
  # ## push changes

  # Push objects to userDB using the `_bulk_docs` API.
  # If no objects passed, push all changed documents
  push : (docs) =>
    
    return @hoodie.defer().resolve([]).promise() unless docs?.length
      
    docsForRemote = (@_parseForRemote doc for doc in docs)
    
    @_pushRequest = @request 'POST', "/_bulk_docs"
      data : JSON.stringify
        docs      : docsForRemote
        newEdits  : false

    # when push is successful, update the local store with the generated _rev numbers
    @_pushRequest.done @_handlePushSuccess docs, docsForRemote


  # ## sync changes

  # pull ... and push ;-)
  sync : (docs) =>
    if @isContinuouslyPushing()
      @hoodie.unbind 'store:dirty:idle', @push
      @hoodie.on     'store:dirty:idle', @push
    
    @push(docs).pipe @pull

  
  # ## On

  # alias for `hoodie.on`
  on : (event, cb) -> @hoodie.on "remote:#{event}", cb
  
  

  # ## Private
  
  
  # ### pull url

  # Depending on whether isContinuouslyPulling() is true, return a longpoll URL or not
  #
  _pullUrl : ->
    since = @getSinceNr()
    if @isContinuouslyPulling() # make a long poll request
      "/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=#{since}"
    else
      "/_changes?include_docs=true&since=#{since}"
  
  # request gets restarted automaticcally in @_handlePullError
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
      when 403
        @hoodie.trigger 'remote:error:unauthenticated', error
        @disconnect()
      
      # the 404 comes, when the requested DB of the User has been removed. 
      # Should really not happen. 
      # 
      # BUT: it might also happen that the profileDB is not ready yet. 
      #      Therefore, we try it again in 3 seconds
      #
      # TODO: review / rethink that.
      when 404
        window.setTimeout @pull, 3000
      
      # Please server, don't give us these. At least not persistently 
      when 500
        @hoodie.trigger 'remote:error:server', error
        window.setTimeout @pull, 3000
      
      # usually a 0, which stands for timeout or server not reachable.
      else
        return unless @isContinuouslyPulling()

        if xhr.statusText is 'abort'
          # manual abort after 25sec. restart pulling changes directly when isContinuouslyPulling() is true
          @pull()
        else    
            
          # oops. This might be caused by an unreachable server.
          # Or the server canceld it for what ever reason, e.g.
          # heroku kills the request after ~30s.
          # we'll try again after a 3s timeout
          window.setTimeout @pull, 3000


  # valid CouchDB doc attributes starting with an underscore
  _validSpecialAttributes : [
    '_id', '_rev', '_deleted', '_revisions', '_attachments'
  ]


  # ### parse from remote

  # parse object for remote storage. All attributes starting with an 
  # `underscore` do not get synchronized despite the special attributes
  # `_id`, `_rev` and `_deleted` (see above)
  # 
  # Also `id` gets replaced with `_id` which consists of type & id
  #
  _parseForRemote : (obj) ->
    attributes = $.extend {}, obj
  
    for attr of attributes
      continue if ~@_validSpecialAttributes.indexOf(attr)
      continue unless /^_/.test attr
      delete attributes[attr]
   
    # prepare CouchDB id
    attributes._id = "#{attributes.type}/#{attributes.id}"
    delete attributes.id

    # prepare revision
    @_addRevisionTo attributes
    
    return attributes
  

  # ### generate new revision id

  # generates a revision id in the for of {uuid}#{UTC timestamp}
  # Beware that it does not include a leading revision number
  _generateNewRevisionId:  ->
    # get timezone offset
    @_timezoneOffset or= new Date().getTimezoneOffset() * 60

    timestamp   = Date.now() + @_timezoneOffset
    uuid        = @hoodie.my.store.uuid(5)
    "#{uuid}##{timestamp}"
  

  # ### and new revion to objecet

  # get new revision number
  #
  _addRevisionTo : (attributes) ->

    try [currentRevNr, currentRevId] = attributes._rev.split /-/
    currentRevNr = parseInt(currentRevNr) or 0

    newRevisionId       = @_generateNewRevisionId()
    attributes._rev       = "#{currentRevNr + 1}-#{newRevisionId}"
    attributes._revisions = 
      start : 1
      ids   : [newRevisionId]

    if currentRevId
      attributes._revisions.start += currentRevNr
      attributes._revisions.ids.push currentRevId
    
  

  # ### parse object coming from pull for local storage. 

  # renames `_id` attribute to `id` and removes the type from the id,
  # e.g. `document/123` -> `123`
  _parseFromPull : (obj) ->
    
    # handle id and type
    id = obj._id or obj.id
    delete obj._id
    [obj.type, obj.id] = id.split(/\//)
    
    # handle timestameps
    obj.createdAt = new Date(Date.parse obj.createdAt) if obj.createdAt
    obj.updatedAt = new Date(Date.parse obj.updatedAt) if obj.updatedAt
    
    # handle rev
    if obj.rev
      obj._rev = obj.rev
      delete obj.rev
    
    return obj
  
  
  # ### parse object response coming from push for local storage. 

  # removes the type from the id, e.g. `document/123` -> `123`
  # also removes attribute ok
  _parseFromPush : (obj) ->
    
    # handle id and type
    id = obj._id or 
    delete obj._id
    [obj.type, obj.id] = obj.id.split(/\//)
    
    # handle rev
    obj._rev = obj.rev
    delete obj.rev
    
    # remove ok attribute
    delete obj.ok
    
    return obj
  


  # ### handle changes from remote
  
  # note: we don't trigger any events until all changes have been taken care of.
  #       Reason is, that on object could depend on a different object that has
  #       not been stored yet, but is within the same bulk of changes. This 
  #       is especially the case during initial bootstraps after a user logins.
  #
  _handlePullResults : (changes) =>
    _destroyedDocs = []
    _changedDocs   = []
    
    # 1. update or remove objects from local store
    for {doc} in changes
      doc = @_parseFromPull(doc)
      if doc._deleted
        _destroyedDocs.push [doc, @hoodie.my.store.destroy(  doc.type, doc.id,      remote: true)]
      else                                                
        _changedDocs.push   [doc, @hoodie.my.store.update(   doc.type, doc.id, doc, remote: true)]
    
    # 2. trigger events
    for [doc, promise] in _destroyedDocs
      promise.then (object) => 
        @hoodie.trigger 'remote:destroy',                       object
        @hoodie.trigger "remote:destroy:#{doc.type}",           object
        @hoodie.trigger "remote:destroy:#{doc.type}:#{doc.id}", object
        
        @hoodie.trigger 'remote:change',                        'destroy', object
        @hoodie.trigger "remote:change:#{doc.type}",            'destroy', object
        @hoodie.trigger "remote:change:#{doc.type}:#{doc.id}",  'destroy', object
    
    for [doc, promise] in _changedDocs
      promise.then (object, objectWasCreated) => 
        event = if objectWasCreated then 'create' else 'update'
        @hoodie.trigger "remote:#{event}",                       object
        @hoodie.trigger "remote:#{event}:#{doc.type}",           object
        @hoodie.trigger "remote:#{event}:#{doc.type}:#{doc.id}", object
      
        @hoodie.trigger "remote:change",                         event, object
        @hoodie.trigger "remote:change:#{doc.type}",             event, object
        @hoodie.trigger "remote:change:#{doc.type}:#{doc.id}",   event, object



  # ### handle push success

  # bli bla blup :-)
  #
  _handlePushSuccess: (docs, pushedDocs) =>
    =>
      for doc, i in docs
        update  = {_rev: pushedDocs[i]._rev}
        options = remote : true
        @hoodie.my.store.update(doc.type, doc.id, update, options) 