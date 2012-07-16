# Remote patched for Share.
# 
# The only difference is the pull URL, it adds a filter to assure that
# only documents get pulled that belong to the share. This is importent
# when an object gets removed from the share, by removing the share id
# from the objects $shares array and deleting the object. The filter
# avoids that the deletion will be synchronized through the _changes feed.
#

# needs to to have the same name due to hoodie's loading mechanism
# see: Hoodie::_loadModules
class Hoodie.Share.Remote extends Hoodie.RemoteStore
  

  #
  # we only want to push stuff that belongs to this share
  #
  push : (docs) =>
    unless $.isArray docs
      # walk through all changed docs, check if it's
      # 1. the share object itself or
      # 2. an object belonging to the share
      docs = for obj in @hoodie.my.store.changedDocs() when obj.id is @hoodie.share.id or obj.$shares and ~obj.$shares.indexOf(@hoodie.share.id)
        obj 

    super(docs)


  # pull url
  #
  # The pull URL has an addition filter to only pull for the documents
  # that belong to the share, see above
  #
  _pullUrl : ->
    since = @hoodie.my.config.get('_remote.seq') or 0
    if @active # make a long poll request
      "/#{encodeURIComponent @hoodie.my.account.db()}/_changes?filter=%24share_#{@hoodie.share.id}/owned&includeDocs=true&since=#{since}&heartbeat=10000&feed=longpoll"
    else
      "/#{encodeURIComponent @hoodie.my.account.db()}/_changes?filter=%24share_#{@hoodie.share.id}/owned&includeDocs=true&since=#{since}"


  # add revision to object
  #
  # in addition to the standard behavior, we check for the $docsToRemove
  # attribute, to add new revision to these as well.
  _addRevisionTo : (obj) ->
    if obj.$docsToRemove
      console.log "obj.$docsToRemove"
      console.log obj.$docsToRemove
      @_addRevisionTo(doc) for key, doc of obj.$docsToRemove

    super obj


  # handle push success
  #
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