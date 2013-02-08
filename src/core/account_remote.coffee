# AccountRemote
# ===============

# Connection / Socket to our couch
#
# AccountRemote is using CouchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#
# When hoodie.remote is continuously syncing (default), it will continuously 
# synchronize, otherwise sync, pull or push can be called manually
#
class Hoodie.AccountRemote extends Hoodie.Remote

  # properties
  # ------------

  # sync by default
  _sync: true


  # Constructor
  # -------------

  #
  constructor : (@hoodie, options = {}) ->
    # set name to user's DB name
    @name = @hoodie.account.db()
    
    # overwrite default with _remote.sync config, if set
    @_sync = @hoodie.config.get('_remote.sync') if @hoodie.config.get('_remote.sync')?

    # do not prefix files for my own remote
    options.prefix = ''
    
    super(@hoodie, options)
    

  # Connect
  # ---------

  # do not start to sync immediately, but authenticate beforehand
  # 
  connect : =>
    @hoodie.account.authenticate().pipe => super


  # disconnect
  # ------------

  # 
  disconnect: ->
    # binding comes from @sync
    @hoodie.unbind 'store:idle',   @push

    super
  

  # startSyncing
  # --------------

  # start continuous syncing with current users store
  # 
  startSyncing : =>
    @hoodie.config.set '_remote.sync', true

    @hoodie.on 'account:signin',     @_handleSignIn
    @hoodie.on 'account:signout',    @disconnect

    super


  # stopSyncing
  # -------------

  # stop continuous syncing with current users store
  # 
  stopSyncing : =>
    @hoodie.config.set '_remote.sync', false

    @hoodie.unbind 'account:signin',  @_handleSignIn
    @hoodie.unbind 'account:signout', @disconnect

    super


  # sync
  # ------

  # 
  sync : (objects) =>
    if @isContinuouslyPushing()
      @hoodie.unbind 'store:idle', @push
      @hoodie.on     'store:idle', @push

    super
    

  # get and set since nr
  # ----------------------

  # we store the last since number from the current user's store
  # in his config
  # 
  getSinceNr : (since) ->
    @hoodie.config.get('_remote.since') or 0
  setSinceNr : (since) ->
    @hoodie.config.set('_remote.since', since)


  # push
  # ------

  # if no objects passed to be pushed, we default to users changed objects
  # in his store
  push : (objects) =>
    objects = @hoodie.store.changedObjects() unless $.isArray objects
    promise = super(objects)


  # Events
  # --------

  # namespaced alias for `hoodie.on`
  # 
  on  : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1remote:$2"
    @hoodie.on  event, cb
  one : (event, cb) -> 
    event = event.replace /(^| )([^ ]+)/g, "$1remote:$2"
    @hoodie.one event, cb
  
  # namespaced alias for `hoodie.trigger`
  # 
  trigger : (event, parameters...) -> 
    @hoodie.trigger "remote:#{event}", parameters...


  # Private
  # ---------

  # 
  _handleSignIn: =>
    @name = @hoodie.account.db()
    @connect()