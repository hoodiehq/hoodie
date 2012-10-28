# RemoteStore
# ============

# add / find / update / remove objects in a Couch Database
#
# API
# -----
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
#
# Event binding
# ---------------
#
# * on(event, callback)
#
class Hoodie.RemoteStore extends Hoodie.Store


  # Constructor 
  # -------------
  
  # sets name (think: namespace) and some other options
  constructor : (@hoodie, @remote) ->

  # find
  # ------
  
  # find one object
  find : (type, id) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "/" + encodeURIComponent "#{type}/#{id}"
    @remote.request("GET", path).pipe(@parseFromRemote)

  
  # findAll
  # ---------
  
  # find all objects, can be filetered by a type
  findAll : (type) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    path = "/_all_docs?include_docs=true"
    switch true
      when type? and @remote.prefix isnt ''
        keyPrefix = "#{@remote.prefix}/#{type}"
      when type?
        keyPrefix = type
      when @remote.prefix isnt ''
        keyPrefix = @remote.prefix
      else
        keyPrefix = ''

    if keyPrefix
      path = "#{path}&startkey=\"#{keyPrefix}\/\"&endkey=\"#{keyPrefix}0\""

    promise = @remote.request "GET", path
    promise.fail defer.reject
    promise.pipe(@_mapDocsFromFindAll).pipe(@parseAllFromRemote).done defer.resolve

    return defer.promise()
  

  # save
  # ------
  
  # save a new object. If it existed before, all properties
  # will be overwritten 
  save : (type, id, object) ->
    defer = super
    return defer if @hoodie.isPromise(defer)

    id = @hoodie.uuid() unless id 
    object = $.extend {
      $type : type
      id    : id
    }, object

    doc   = @parseForRemote object
    path  = "/" + encodeURIComponent doc._id

    @remote.request "PUT", path, data: doc

  
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


  # Parse for remote
  # ------------------

  # parse object for remote storage. All attributes starting with an 
  # `underscore` do not get synchronized despite the special attributes
  # `_id`, `_rev` and `_deleted` (see above)
  # 
  # Also `id` gets replaced with `_id` which consists of type & id
  #
  parseForRemote : (obj) ->
    attributes = $.extend {}, obj
  
    for attr of attributes
      continue if ~@_validSpecialAttributes.indexOf(attr)
      continue unless /^_/.test attr
      delete attributes[attr]
   
    # prepare CouchDB id
    attributes._id = "#{attributes.$type}/#{attributes.id}"
    if @remote.prefix
      attributes._id = "#{@remote.prefix}/#{attributes._id}"
    
    delete attributes.id
    
    @_addRevisionTo attributes

    return attributes


  # parseFromRemote
  # -----------------
  #
  # normalize objects coming from remote

  # renames `_id` attribute to `id` and removes the type from the id,
  # e.g. `document/123` -> `123`
  parseFromRemote : (obj) =>

    # handle id and type
    id = obj._id or obj.id
    delete obj._id
    id = id.replace(RegExp('^'+@remote.prefix+'/'), '') if @remote.prefix
    [obj.$type, obj.id] = id.split(/\//)
    
    # handle timestameps
    obj.$createdAt = new Date(Date.parse obj.$createdAt) if obj.$createdAt
    obj.$updatedAt = new Date(Date.parse obj.$updatedAt) if obj.$updatedAt
    
    # handle rev
    if obj.rev
      obj._rev = obj.rev
      delete obj.rev
    
    return obj
  
  parseAllFromRemote : (objects) =>
    @parseFromRemote(object) for object in objects

  
  # Events
  # --------

  # namespaced alias for `hoodie.on`
  on  : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1#{@remote.name}:store:$2"
    @hoodie.on  event, cb
  one : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1#{@remote.name}:store:$2"
    @hoodie.one  event, cb

  # namespaced alias for `hoodie.trigger`
  trigger : (event, parameters...) -> 
    @hoodie.trigger "#{@remote.name}:store:#{event}", parameters...


  # Private
  # --------------


  # valid CouchDB doc attributes starting with an underscore
  _validSpecialAttributes : [
    '_id', '_rev', '_deleted', '_revisions', '_attachments'
  ]
  

  # ### generate new revision id

  # 
  _generateNewRevisionId:  -> @hoodie.uuid(9)
  

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


  # ### map docs from findAll

  #
  _mapDocsFromFindAll: (response) =>
    response.rows.map (row) -> row.doc