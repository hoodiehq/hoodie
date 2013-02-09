# AccountRemote
# ===============

# Connection / Socket to our couch
#
# AccountRemote is using CouchDB's `_changes` feed to 
# listen to changes and `_bulk_docs` to push local changes
#
# When hoodie.remote is continuously syncing (default), 
# it will continuously  synchronize with local store, 
# otherwise sync, pull or push can be called manually
#
class Hoodie.AccountRemote extends Hoodie.Remote

  # properties
  # ------------

  # connect by default
  connected: true


  # Constructor
  # -------------

  #
  constructor : (@hoodie, options = {}) ->
    # set name to user's DB name
    @name = @hoodie.account.db()
    
    # overwrite default with _remote.connected config, if set
    @connected = @hoodie.config.get('_remote.connected') if @hoodie.config.get('_remote.connected')?

    # do not prefix files for my own remote
    options.prefix = ''
    
    super(@hoodie, options)
    

  # Connect
  # ---------

  # do not start to connect immediately, but authenticate beforehand
  # 
  connect : =>
    @hoodie.account.authenticate().pipe => 
      @hoodie.config.set '_remote.connected', true

      @hoodie.on 'account:signin',  @_handleSignIn
      @hoodie.on 'account:signout', @disconnect
      @hoodie.on 'store:idle',      @push

      super


  # disconnect
  # ------------

  # 
  disconnect: ->
    @hoodie.config.set '_remote.connected', false

    @hoodie.unbind 'account:signin',  @_handleSignIn
    @hoodie.unbind 'account:signout', @disconnect
    @hoodie.unbind 'store:idle',      @push

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

  # if no objects passed to be pushed, we default to 
  # changed objects in user's local store
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
  _handleSignIn : =>
    @name = @hoodie.account.db()
    @connect()