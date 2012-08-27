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
        docs = for obj in @hoodie.my.store.changedDocs() when obj.id is @hoodie.share.id or obj.$shares?[@hoodie.share.id]
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


  # handle push success

  # before handing over the docs (that have been replicated to the couch)
  # to the default procedure, we update the doc.$shares hash
  _handlePushSuccess: (docs, pushedDocs) =>
    =>
      for doc in docs
        if doc.$shares?[@hoodie.share.id] is false
          delete doc.$shares?[@hoodie.share.id]
          doc.$shares = undefined if $.isEmptyObject doc.$shares
          update = $shares : doc.$shares
          @hoodie.my.store.update(type, id, update, remote: true)

      super(docs, pushedDocs)()


  # parse for remote

  # on top of the default parsing, we make some adjustments before pushing
  # an object to the share remote store:
  #
  # 1. we munge the `_id` by prepending it with share._id
  # 2. if obj.$shares[share.id] is false, we mark the object as deleted
  # 3. if obj.$shares[share.id] is an array (attributes marked to be shared),
  #    we remove all other attributes.
  # 4. we remove the $shares attribute
  _parseForRemote : (obj) ->
    attributes = super

    if obj.id is @hoodie.share.id
      attributes
    else
      attributes._id = "$share/#{@hoodie.share.id}/#{attributes._id}"

      if attributes.$shares[@hoodie.share.id] is false
        attributes._deleted = true

      attributes
