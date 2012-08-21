# RemoteStore
# ============

# Connection / Socket to our couch
#
# RemoteStore is using CouchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#
# When hoodie.my.remote is continuously syncing (default), it will continuously 
# synchronize, otherwise sync, pull or push can be called manually
#
class Hoodie.Account.RemoteStore extends Hoodie.RemoteStore

  # ## properties

  # sync by default
  _sync: true

  # ## Constructor
  #
  constructor : ->
    super

    # set basePath to user's DB name
    @basePath = "/#{encodeURIComponent @hoodie.my.account.db()}"
    
    # overwrite default with _remote.sync config, if set
    @_sync = @hoodie.my.config.get('_remote.sync') if @hoodie.my.config.get('_remote.sync')?
    
    @startSyncing() if @isContinuouslySyncing()
  

  # ## startSyncing

  # start continuous syncing with current users store
  # 
  startSyncing : =>
    @hoodie.my.config.set '_remote.sync', @_sync = true

    @hoodie.on 'account:signout',    @disconnect
    @hoodie.on 'account:signin',     @connect

    @connect()

  # ## stopSyncing

  # stop continuous syncing with current users store
  # 
  stopSyncing : =>
    @hoodie.my.config.set '_remote.sync', @_sync = false

    @hoodie.unbind 'account:signin',  @connect
    @hoodie.unbind 'account:signout', @disconnect

    @disconnect()
    

  # ## Connect

  # do not start to sync immediately, but authenticate beforehand
  connect : =>
    @hoodie.my.account.authenticate().pipe =>  
      super
    

  # ## get and set since nr

  # we store the last since number from the current user's store
  # in his config
  getSinceNr: (since) ->
    @hoodie.my.config.get('_remote.since') or 0
  setSinceNr: (since) ->
    @hoodie.my.config.set '_remote.since', since


  # ## push

  # if no docs passed to be pushed, we default to users changed objects
  # in his store
  push: (docs) =>
    docs = @hoodie.my.store.changedDocs() unless $.isArray docs
    super(docs)