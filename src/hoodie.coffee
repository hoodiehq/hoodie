# Hoodie
# --------
#
# the door to world domination (apps)
#

class Hoodie extends Events
  
  # ## Settings

  # `online` (read-only)
  online : true

  # `checkConnectionInterval` (read-only)
  checkConnectionInterval : 30000 # 30 seconds

  # ## Constructor

  # When initializing a hoodie instance, an optional URL
  # can be passed. That's the URL of a hoodie backend.
  # If no URL passed it defaults to the current domain
  # with an `api` subdomain.
  #
  #     // init a new hoodie instance
  #     hoodie = new Hoodie
  #
  constructor : (@baseUrl) ->

    if @baseUrl
      # remove trailing slash(es)
      @baseUrl = @baseUrl.replace /\/+$/, ''

    else 
      @baseUrl = "/_api"

    # init core modules 
    @store   = new @constructor.LocalStore this
    @config  = new @constructor.Config this
    @account = new @constructor.Account this
    @remote  = new @constructor.AccountRemote this

    # init extensions
    @_loadExtensions()

    # check connection
    @checkConnection()
  

  # ## Requests

  # use this method to send requests to the hoodie backend.
  # 
  #     promise = hoodie.request('GET', '/user_database/doc_id')
  #
  request : (type, url, options = {}) ->

    # if a relative path passed, prefix with @baseUrl
    url = "#{@baseUrl}#{url}" unless /^http/.test url

    defaults =
      type        : type
      url         : url
      xhrFields   : withCredentials: true
      crossDomain : true
      dataType    : 'json'

    $.ajax($.extend defaults, options)


  # ## Check Connection

  # the `checkConnection` method is used, well, to check if
  # the hoodie backend is reachable at `baseUrl` or not. 
  # Check Connection is automatically called on startup
  # and then each 30 seconds. If it fails, it 
  # 
  # - sets `hoodie.online = false`
  # - triggers `offline` event
  # - sets `checkConnectionInterval = 3000`
  # 
  # when connection can be reestablished, it
  # 
  # - sets `hoodie.online = true`
  # - triggers `online` event
  # - sets `checkConnectionInterval = 30000`
  _checkConnectionRequest : null
  checkConnection : =>
    return @_checkConnectionRequest if @_checkConnectionRequest?.state?() is 'pending'

    @_checkConnectionRequest = @request('GET', '/')
    .pipe( @_handleCheckConnectionSuccess, @_handleCheckConnectionError )


  # ## Open stores

  # generic method to open a store. Used by
  #
  # * hoodie.remote
  # * hoodie.user("joe")
  # * hoodie.global
  # * ... and more
  # 
  #     hoodie.open("some_store_name").findAll()
  #
  open : (storeName, options = {}) ->
    $.extend options, name: storeName
    new Hoodie.Remote this, options
  

  # ## uuid

  # helper to generate unique ids.
  uuid : (len = 7) ->
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
    radix = chars.length
    (
      chars[ 0 | Math.random()*radix ] for i in [0...len]
    ).join('')


  # ## Defers / Promises

  # returns a defer object for custom promise handlings.
  # Promises are heavely used throughout the code of hoodie.
  # We currently borrow jQuery's implementation:
  # http://api.jquery.com/category/deferred-object/
  # 
  #     defer = hoodie.defer()
  #     if (good) {
  #       defer.resolve('good.')
  #     } else {
  #       defer.reject('not good.')
  #     }
  #     return defer.promise()
  # 
  defer: $.Deferred
  
  # 
  isPromise : (obj) ->
    typeof obj?.done is 'function' and typeof obj.resolve is 'undefined'

  #
  resolve : =>
    @defer().resolve().promise()

  #
  reject : =>
    @defer().reject().promise()

  #
  resolveWith : =>
    @defer().resolve( arguments... ).promise()

  # 
  rejectWith : =>
    @defer().reject( arguments... ).promise()


  # dispose
  # ---------

  # if a hoodie instance is not needed anymore, it can
  # be disposed using this method. A `dispose` event
  # gets triggered that the modules react on.
  dispose : ->
    @trigger 'dispose'
    
  
  # ## Extending hoodie

  # You can either extend the Hoodie class, or a hoodie
  # instance dooring runtime
  #
  #     Hoodie.extend('magic1', funcion(hoodie) { /* ... */ })
  #     hoodie = new Hoodie
  #     hoodie.extend('magic2', function(hoodie) { /* ... */ })
  #     hoodie.magic1.doSomething()
  #     hoodie.magic2.doSomethingElse()
  @extend : (name, Module) -> 
    @_extensions ||= {}
    @_extensions[name] = Module
  extend : (name, Module) -> 
    @[name] = new Module this

  # ## Private
  
  #
  _loadExtensions: ->
    for instanceName, Module of @constructor._extensions
      @[instanceName] = new Module this

  #
  _handleCheckConnectionSuccess : (response) =>
    @checkConnectionInterval = 30000
    window.setTimeout @checkConnection, @checkConnectionInterval

    unless @online
      @trigger 'reconnected'
      @online = true
    return @defer().resolve()

  #
  _handleCheckConnectionError : (response) =>
    @checkConnectionInterval = 3000
    window.setTimeout @checkConnection, @checkConnectionInterval
    if @online
      @trigger 'disconnected'
      @online = false
    return @defer().reject()

module.exports = Hoodie if module?.exports