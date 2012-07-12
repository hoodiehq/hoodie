# Remote patched for Sharing.
# 
# The only difference is the pull URL, it adds a filter to assure that
# only documents get pulled that belong to the sharing. This is importent
# when an object gets removed from the sharing, by removing the sharing id
# from the objects $sharings array and deleting the object. The filter
# avoids that the deletion will be synchronized through the _changes feed.
#

# needs to to have the same name due to hoodie's loading mechanism
# see: Hoodie::_loadModules
class Hoodie.Sharing.Remote extends Hoodie.Remote
  

  #
  # we only want to push stuff that belongs to this sharing
  #
  push : (docs) =>
    unless $.isArray docs
      # walk through all changed docs, check if it's
      # 1. the sharing object itself or
      # 2. an object belonging to the sharing
      docs = for obj in @hoodie.store.changedDocs() when obj.id is @hoodie.sharing.id or obj.$sharings and ~obj.$sharings.indexOf(@hoodie.sharing.id)
        obj 

    super(docs)


  # pull url
  #
  # The pull URL has an addition filter to only pull for the documents
  # that belong to the sharing, see above
  #
  _pullUrl : ->
    since = @hoodie.config.get('_remote.seq') or 0
    if @active # make a long poll request
      "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&includeDocs=true&since=#{since}&heartbeat=10000&feed=longpoll"
    else
      "/#{encodeURIComponent @hoodie.account.db()}/_changes?filter=%24sharing_#{@hoodie.sharing.id}/owned&includeDocs=true&since=#{since}"


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
            @hoodie.store.update(type, id, update, remote: true) for doc, i in docs

      super(docs, pushedDocs)()