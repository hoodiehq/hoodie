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
  
  #
  startSyncing : =>
    @hoodie.my.config.set '_remote.sync', @_sync = true

    @hoodie.on 'account:signedOut',    @disconnect
    @hoodie.on 'account:signedIn',     @connect

    @connect()

  #
  stopSyncing : =>
    @hoodie.my.config.set '_remote.sync', @_sync = false

    @hoodie.unbind 'account:signedIn',  @connect
    @hoodie.unbind 'account:signedOut', @disconnect

    @disconnect()
    
  # ## Connect
  #
  # do not start to sync immediately, but authenticate beforehand
  connect : =>
    @hoodie.my.account.authenticate().pipe =>  
      super
    

  