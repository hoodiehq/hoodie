# RemoteStore
# ============

# Connection to Couch Database
#
# API
# -----
#
# object loading / updating / deleting
#
# * find(type, id)
# * findAll(type )
# * create(type, object)
# * save(type, id, object)
# * update(new_properties )
# * updateAll( type, new_properties)
# * destroy(type, id)
# * destroyAll(type)
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
class Hoodie.RemoteStore extends Hoodie.Store


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
  _prefix : ''


  # Constructor 
  # -------------
  
  # sets name (think: namespace) and some other options
  constructor : (@hoodie, options = {}) ->
    @name    = options.name   if options.name
    @_sync   = options.sync   if options.sync
    @_prefix = options.prefix if options.prefix
    @startSyncing() if @isContinuouslySyncing()


  # find
  # ------
  
  # find one object
  find : (type, id) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "/" + encodeURIComponent "#{type}/#{id}"
    @request("GET", path).pipe(@_parseTimeStamps)

  
  # findAll
  # ---------
  
  # find all objects, can be filetered by a type
  findAll : (type) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "/_all_docs?include_docs=true"
    switch true
      when type? and @_prefix isnt ''
        keyPrefix = "#{@_prefix}/#{type}"
      when type?
        keyPrefix = type
      when @_prefix isnt ''
        keyPrefix = @_prefix
      else
        keyPrefix = ''

    if keyPrefix
      path = "#{path}&startkey=\"#{keyPrefix}\/\"&endkey=\"#{keyPrefix}0\""

    promise = @request "GET", path
    promise.fail defer.reject
    promise.pipe(@_mapDocsFromFindAll).pipe(@_parseTimeStamps).done defer.resolve

    return defer.promise()
  

  # save
  # ------
  
  # save a new object. If it existed before, all properties
  # will be overwritten 
  save : (type, id, object) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    id = @uuid() unless id 
    object = $.extend {
      $type : type
      id    : id
    }, object

    doc   = @_parseForRemote object
    path  = "/" + encodeURIComponent doc._id

    @request "PUT", path, data: doc

  
  # destroy
  # ---------
  
  # destroy one object
  destroy : (type, id) ->
    @update type, id, _deleted: true

  
  # destroyAll
  # ------------
  
  # destroy all objects, can be filtered by type
  destroyAll : (type) ->
    @updateAll type, _deleted: true

  
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
      docsForRemote.push @_parseForRemote doc 
    
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


  # valid CouchDB doc attributes starting with an underscore
  _validSpecialAttributes : [
    '_id', '_rev', '_deleted', '_revisions', '_attachments'
  ]


  # ### parse for remote

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
    attributes._id = "#{attributes.$type}/#{attributes.id}"
    if @_prefix
      attributes._id = "#{@_prefix}/#{attributes._id}"
    
    delete attributes.id
    
    @_addRevisionTo attributes

    return attributes
  

  # ### generate new revision id

  # 
  _generateNewRevisionId:  ->
    uuid        = @hoodie.my.store.uuid(9)
    return uuid
  

  # ### and new revion to objecet

  # get new revision number
  #
  _addRevisionTo : (attributes) ->

    try [currentRevNr, currentRevId] = attributes._rev.split /-/
    currentRevNr = parseInt(currentRevNr, 10) or 0

    newRevisionId         = @_generateNewRevisionId()
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
    [obj.$type, obj.id] = id.split(/\//)
    
    # handle timestameps
    obj.$createdAt = new Date(Date.parse obj.$createdAt) if obj.$createdAt
    obj.$updatedAt = new Date(Date.parse obj.$updatedAt) if obj.$updatedAt
    
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
    [obj.$type, obj.id] = obj.id.split(/\//)
    
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
  #       is especially the case during initial bootstraps after a user signs in.
  #
  _handlePullResults : (changes) =>
    _destroyedDocs = []
    _changedDocs   = []
    
    # 1. update or remove objects from local store
    for {doc} in changes
      doc = @_parseFromPull(doc)
      if doc._deleted
        _destroyedDocs.push [doc, @hoodie.my.store.destroy( doc.$type, doc.id,      remote: true)]
      else                                                
        _changedDocs.push   [doc, @hoodie.my.store.save(    doc.$type, doc.id, doc, remote: true)]
    
    # 2. trigger events
    for [doc, promise] in _destroyedDocs
      promise.then (object) => 
        @trigger 'destroy',                        object
        @trigger "destroy:#{doc.$type}",           object
        @trigger "destroy:#{doc.$type}:#{doc.id}", object
        
        @trigger 'change',                         'destroy', object
        @trigger "change:#{doc.$type}",            'destroy', object
        @trigger "change:#{doc.$type}:#{doc.id}",  'destroy', object
    
    for [doc, promise] in _changedDocs
      promise.then (object, objectWasCreated) => 
        event = if objectWasCreated then 'create' else 'update'
        @trigger event,                             object
        @trigger "#{event}:#{doc.$type}",           object
        @trigger "#{event}:#{doc.$type}:#{doc.id}", object unless event is 'create'
      
        @trigger "change",                          event, object
        @trigger "change:#{doc.$type}",             event, object
        @trigger "change:#{doc.$type}:#{doc.id}",   event, object unless event is 'create'


  # ### handle push success

  # update local _rev attributes after changes pushed
  _handlePushSuccess: (docs, pushedDocs) =>
    =>
      for doc, i in docs
        update  = {_rev: pushedDocs[i]._rev}
        options = remote : true
        @hoodie.my.store.update(doc.$type, doc.id, update, options) 


  # ### map docs from findAll

  # findAll returns something like this:
  # 
  #     tbd
  _mapDocsFromFindAll: (response) =>
    response.rows.map (row) -> row.doc


  # ### parse timestamps

  #
  _parseTimeStamps: (obj) =>
    if $.isArray obj
      @_parseTimeStamps(_obj) for _obj in obj
    else
      obj.$createdAt = new Date(Date.parse obj.$createdAt) if obj.$createdAt
      obj.$updatedAt = new Date(Date.parse obj.$updatedAt) if obj.$updatedAt
      return obj