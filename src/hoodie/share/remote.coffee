# Remote patched for Share.
# 
# The only difference is the pull URL, it adds a filter to assure that
# only documents get pulled that belong to the share. This is important
# when an object gets removed from the share, by removing the share id
# from the objects $shares array and deleting the object. The filter
# avoids that the deletion will be synchronized through the _changes feed.
#

# needs to to have the same name due to hoodie's loading mechanism
# see: Hoodie::_loadModules
class Hoodie.Share.Remote extends Hoodie.RemoteStore
  
  
  # ## Constructor 
  
  # adjustments for share remotes
  constructor : ->
    super

    # set basePath to shares DB name
    @basePath = "/#{encodeURIComponent @hoodie.my.account.db()}"
    
    # overwrite default with _remote.sync config, if set
    if @hoodie.share.continuous is true
      @_sync = true
      @connect()


  # ## push

  # we only want to push stuff that belongs to this share.
  # Also we make sure that 
  push : (docs) =>
    @_assureExistingShareAccount =>
      unless $.isArray docs
        # walk through all changed docs, check if it's
        # 1. the share object itself or
        # 2. an object belonging to the share
        docs = for obj in @hoodie.my.store.changedDocs() when obj.id is @hoodie.share.id or obj.$shares and ~obj.$shares.indexOf(@hoodie.share.id)
          obj 

      super(docs)


  # ## pull

  #
  pull : =>
    @_assureExistingShareAccount =>
      super


  # ## PRIVATE

  # assure existing share account

  # if the user has no own account, we have to make an anonymous share.
  # To achieve that, an own couchDB user account needs to be created
  # for the share
  _assureExistingShareAccount: (callback) ->
    defer = @hoodie.defer()

    if @hoodie.share.hasAccount()
      return defer.resolve().pipe callback()
    
    @hoodie.my.account.signUp( "share/#{@hoodie.share.id}", @hoodie.share.password )
    .done (username, response) =>
      
      # remember that we signed up successfully for the future
      @hoodie.share.save _userRev: @hoodie.my.account._doc._rev
      
      # finally: start the sync and make it the default behavior
      # from now on
      defer.resolve().pipe callback()

    return defer.promise()

  # pull url

  # The pull URL has an addition filter to only pull for the documents
  # that belong to the share, see above
  #
  _pullUrl : ->
    url = super
    "#{url}&filter=filters/share"


  # add revision to object

  # in addition to the standard behavior, we check for the $docsToRemove
  # attribute, to add new revision to these as well.
  _addRevisionTo : (obj) ->
    if obj.$docsToRemove
      console.log "obj.$docsToRemove"
      console.log obj.$docsToRemove
      @_addRevisionTo(doc) for key, doc of obj.$docsToRemove

    super obj


  # handle push success

  # before handing over the docs (that have been replicated to the couch)
  # to the default procedure, we check for the $docsToRemove attribute
  # again, and handle these documents upfront
  _handlePushSuccess: (docs, pushedDocs) =>
    =>
      for pushedDoc in pushedDocs
        if pushedDoc.$docsToRemove
          for key, doc of pushedDoc.$docsToRemove
            [type, id] = key.split /\//
            update = _rev: doc._rev
            @hoodie.my.store.update(type, id, update, remote: true) for doc, i in docs

      super(docs, pushedDocs)()

