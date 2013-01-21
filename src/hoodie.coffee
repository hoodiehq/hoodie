#
# Hoodie
# --------
#
# the door to world domination (apps)
#

class Hoodie extends Events

  # these modules hold the core functionality
  # for hoodie to run. They depend on each other.
  @modules : 
    store   : 'LocalStore'
    config  : 'Config'
    account : 'Account'
    remote  : 'AccountRemote'


  # Besides the core modules, extensions can be loaded.
  # The following extensions are availabale but default,
  # but more can be added.
  @extensions : 
    user    : 'User'
    global  : 'Global'
    email   : 'Email'
    share   : 'Share'


  # extend Hoodie with custom module. Supports both named and anonymous modules
  #
  #     class myHoodieModule
  #       // do some magic
  #
  #     Hoodie.extend('magic', MyHoodieModule)
  #
  @extend : (name, Module) ->
    @extensions[name] = Module
  

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

      @baseUrl = location.protocol + "//api." + location.hostname

    @_loadModules @constructor.modules
    @_loadModules @constructor.extensions
  

  # ## Requests

  # use this method to send requests to the hoodie backend.
  # 
  #     promise = hoodie.request('GET', '/user_database/doc_id')
  #
  request : (type, path, options = {}) ->
    defaults =
      type        : type
      url         : "#{@baseUrl}#{path}"
      xhrFields   : withCredentials: true
      crossDomain : true
      dataType    : 'json'

    $.ajax $.extend defaults, options


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
  open : (store_name, options = {}) ->
    $.extend options, name: store_name
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
  resolveWith : ->
    @defer().resolve( arguments... ).promise()

  # 
  rejectWith : ->
    @defer().reject( arguments... ).promise()
  

  # ## Private
  
  #
  _loadModules: (modules = @constructor.modules, context = this) ->

    for instanceName, moduleName of modules
        
      switch typeof moduleName
        when 'string'
          context[instanceName] = new Hoodie[moduleName] this
        when 'function'  
          context[instanceName] = new moduleName this