# Remote
# ========

# Connection to a remote Couch Database.
#
# store API
# ----------------
#
# object loading / updating / deleting
#
# * find(type, id)
# * findAll(type )
# * add(type, object)
# * save(type, id, object)
# * update(new_properties )
# * updateAll( type, new_properties)
# * remove(type, id)
# * removeAll(type)
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
class Hoodie.Remote extends Hoodie.Store

  # properties
  # ------------

  # name  

  # the name of the Remote is the name of the
  # CouchDB database and is also used to prefix 
  # triggered events
  name : undefined
  
  # sync  

  # if set to true, updates will be continuously pulled
  # and pushed. Alternatively, `sync` can be set to
  # `pull: true` or `push: true`.
  connected : false

  # prefix

  # prefix for docs in a CouchDB database, e.g. all docs
  # in public user stores are prefixed by '$public/'
  prefix : ''


  # Constructor 
  # -------------
  
  # sets name (think: namespace) and some other options
  constructor : (@hoodie, options = {}) ->
    
    #
    @name      = options.name      if options.name?  
    @prefix    = options.prefix    if options.prefix?
    @connected = options.connected if options.connected?
    @baseUrl   = options.baseUrl   if options.baseUrl?

    # in order to differentiate whether an object from remote should trigger a 'new'
    # or an 'update' event, we store a hash of known objects
    @_knownObjects = {}

    # NOTE: 
    # Due to a bug in Chrome (I guess), the loader won't disappear
    # when the page is loaded, when we start a long poll request
    # before the page loaded.
    # On the other side, we do not want to wait for to the page
    # and all its assets to be loaded before we start loading
    # our data. 
    # A good way to fix it would be a special `bootstrap` method,
    # that would load all objects with a normal GET /_all_docs request,
    # after that it would start with the GET /_changes requests,
    # starting with the current seq number of the database.
    @connect() if @isConnected()


  # request
  # ---------
  
  # wrapper for hoodie.request, with some store specific defaults
  # and a prefixed path
  request : (type, path, options = {}) ->
    path = "/#{encodeURIComponent @name}#{path}" if @name
    path = "#{@baseUrl}#{path}" if @baseUrl

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




  # Store Operations overides
  # ---------------------------

  # find
  # ------
  
  # find one object
  find : (type, id) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "#{type}/#{id}"
    path = @prefix + path if @prefix
    path = "/" + encodeURIComponent path
    @request("GET", path).pipe(@_parseFromRemote)

  
  # findAll
  # ---------
  
  # find all objects, can be filetered by a type
  findAll : (type) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "/_all_docs?include_docs=true"
    switch true
      when type? and @prefix isnt ''
        startkey = "#{@prefix}#{type}/"
      when type?
        startkey = "#{type}/"
      when @prefix isnt ''
        startkey = @prefix
      else
        startkey = ''

    if startkey
      # make sure that only objects starting with
      # `startkey` will be returned
      endkey = startkey.replace /.$/, (char) ->
        charCode = char.charCodeAt(0)
        String.fromCharCode( charCode + 1 )
      path = "#{path}&startkey=\"#{encodeURIComponent startkey}\"&endkey=\"#{encodeURIComponent endkey}\""

    @request("GET", path)
    .pipe(@_mapDocsFromFindAll)
    .pipe(@_parseAllFromRemote)
  

  # save
  # ------
  
  # save a new object. If it existed before, all properties
  # will be overwritten 
  save : (type, id, object) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    id = @hoodie.uuid() unless id 
    object = $.extend {
      type : type
      id   : id
    }, object

    object = @_parseForRemote object
    path   = "/" + encodeURIComponent object._id

    @request "PUT", path, data: object

  
  # remove
  # ---------
  
  # remove one object
  remove : (type, id) ->
    @update type, id, _deleted: true

  
  # removeAll
  # ------------
  
  # remove all objects, can be filtered by type
  removeAll : (type) ->
    @updateAll type, _deleted: true



  # synchronization
  # -----------------

  # Connect
  # ---------

  # start syncing
  connect : (options) =>
    @connected = true
    @pull()
  
    
  # Disconnect
  # ------------

  # stop syncing changes from remote store
  disconnect : =>
    @connected = false
    
    @_pullRequest?.abort()
    @_pushRequest?.abort()
  
    
  # isConnected
  # -------------

  # 
  isConnected : ->
    @connected


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

    if @isConnected()
      window.clearTimeout @_pullRequestTimeout
      @_pullRequestTimeout = window.setTimeout @_restartPullRequest, 25000 # 25 sec
    
    @_pullRequest.then @_handlePullSuccess, @_handlePullError
    
    
  # push changes
  # --------------

  # Push objects to remote store using the `_bulk_docs` API.
  push : (objects) =>
    
    return @hoodie.resolveWith([]) unless objects?.length
      
    objectsForRemote = []
    for object in objects
      @_addRevisionTo object
      object = @_parseForRemote object 
      objectsForRemote.push object
    
    @_pushRequest = @request 'POST', "/_bulk_docs",
      data :
        docs      : objectsForRemote
        new_edits : false


  # sync changes
  # --------------

  # push objects, then pull updates.
  sync : (objects) =>
    @push(objects).pipe @pull

  
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

  # valid CouchDB doc attributes starting with an underscore
  _validSpecialAttributes : [
    '_id', '_rev', '_deleted', '_revisions', '_attachments'
  ]


  # Parse for remote
  # ------------------

  # parse object for remote storage. All properties starting with an 
  # `underscore` do not get synchronized despite the special properties
  # `_id`, `_rev` and `_deleted` (see above)
  # 
  # Also `id` gets replaced with `_id` which consists of type & id
  #
  _parseForRemote : (object) ->
    properties = $.extend {}, object
  
    for attr of properties
      continue if ~@_validSpecialAttributes.indexOf(attr)
      continue unless /^_/.test attr
      delete properties[attr]
   
    # prepare CouchDB id
    properties._id = "#{properties.type}/#{properties.id}"
    if @prefix
      properties._id = "#{@prefix}#{properties._id}"
    
    delete properties.id

    return properties


  # _parseFromRemote
  # -----------------
  #
  # normalize objects coming from remote

  # renames `_id` attribute to `id` and removes the type from the id,
  # e.g. `type/123` -> `123`
  _parseFromRemote : (object) =>

    # handle id and type
    id = object._id or object.id
    delete object._id
    id = id.replace(RegExp('^'+@prefix), '') if @prefix

    # turn doc/123 into type = doc & id = 123
    # NOTE: we don't use a simple id.split(/\//) here,
    # as in some cases IDs might contain "/", too
    [ignore, object.type, object.id] = id.match(/([^\/]+)\/(.*)/)
    
    
    # handle timestameps
    object.createdAt = new Date(Date.parse object.createdAt) if object.createdAt
    object.updatedAt = new Date(Date.parse object.updatedAt) if object.updatedAt
    
    return object
  
  _parseAllFromRemote : (objects) =>
    @_parseFromRemote(object) for object in objects


  # ### _addRevisionTo

  # extends passed object with a _rev property
  #
  _addRevisionTo : (attributes) ->

    try [currentRevNr, currentRevId] = attributes._rev.split /-/
    currentRevNr = parseInt(currentRevNr, 10) or 0

    newRevisionId         = @_generateNewRevisionId()

    # local changes are not meant to be replicated outside of the
    # users database, therefore the `-local` suffix.
    if attributes._$local
      newRevisionId += "-local"

    attributes._rev       = "#{currentRevNr + 1}-#{newRevisionId}"
    attributes._revisions = 
      start : 1
      ids   : [newRevisionId]

    if currentRevId
      attributes._revisions.start += currentRevNr
      attributes._revisions.ids.push currentRevId

    

  

  # ### generate new revision id

  # 
  _generateNewRevisionId:  -> @hoodie.uuid(9)


  # ### map docs from findAll

  #
  _mapDocsFromFindAll: (response) =>
    response.rows.map (row) -> row.doc
  
  # ### pull url

  # Depending on whether remote is connected, return a longpoll URL or not
  #
  _pullUrl : ->
    since = @getSinceNr()
    if @isConnected() # make a long poll request
      "/_changes?include_docs=true&since=#{since}&heartbeat=10000&feed=longpoll"
    else
      "/_changes?include_docs=true&since=#{since}"
  
  # request gets restarted automaticcally 
  # when aborted (see @_handlePullError)
  _restartPullRequest : => @_pullRequest?.abort()


  # ### pull success handler 

  # handle incoming changes, then restart the pull if connected
  #
  _handlePullSuccess : (response) =>
    @setSinceNr response.last_seq
    @_handlePullResults response.results
    
    @pull() if @isConnected()
  
  
  # ### pull error handler 

  # when there is a change, trigger event, 
  # then check for another change
  #
  _handlePullError : (xhr, error, resp) =>
    
    return unless @isConnected()

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
        @hoodie.checkConnection()
      
      # usually a 0, which stands for timeout or server not reachable.
      else
        return unless @isConnected()

        if xhr.statusText is 'abort'
          # manual abort after 25sec. restart pulling changes directly when connected
          @pull()
        else    
            
          # oops. This might be caused by an unreachable server.
          # Or the server canceled it for what ever reason, e.g.
          # heroku kills the request after ~30s.
          # we'll try again after a 3s timeout
          window.setTimeout @pull, 3000

          @hoodie.checkConnection()


  # ### handle changes from remote

  #
  _handlePullResults : (changes) =>
    for {doc} in changes
      continue if @prefix and doc._id.indexOf(@prefix) isnt 0

      object = @_parseFromRemote(doc)
      if object._deleted
        continue unless @_knownObjects[object.id]

        event = 'remove'
        delete @_knownObjects[object.id]

      else
        if @_knownObjects[object.id]
          event = 'update'
        else
          event = 'add'
          @_knownObjects[object.id] = 1

      @trigger "#{event}",                             object
      @trigger "#{event}:#{object.type}",              object
      @trigger "#{event}:#{object.type}:#{object.id}", object      
      @trigger "change",                               event, object
      @trigger "change:#{object.type}",                event, object
      @trigger "change:#{object.type}:#{object.id}",   event, object



class ConnectionError extends Error
  name: "ConnectionError"

  constructor : (@message, @data) -> super
