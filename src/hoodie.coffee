#
# Hoodie
# --------
#
# the door to world domination (apps)
#
class Hoodie extends Events

  # modules to be loaded
  @modules: 
    store   : 'LocalStore'
    config  : 'Config'
    account : 'Account'
    remote  : 'AccountRemote'

  # extensions, get loaded after the core modules
  @extensions : 
    user    : 'User'
    global  : 'Global'
    email   : 'Email'
    share   : 'Share'

  # extend Hoodie with a custom module. Supports both named and anonymous modules
  @extend: (name, Module) ->
    @extensions[name] = Module

  # ## initialization

  # Inits the Hoodie, an optional CouchDB URL can be passed
  constructor : (@baseUrl = '') ->

    # remove trailing slash(es)
    @baseUrl = @baseUrl.replace /\/+$/, ''
    @_loadModules @constructor.modules
    @_loadModules @constructor.extensions
  

  # ## Request

  # use this method to send AJAX request to the Couch.
  #
  request : (type, path, options = {}) ->
    defaults =
      type        : type
      url         : "#{@baseUrl}#{path}"
      xhrFields   : withCredentials: true
      crossDomain : true
      dataType    : 'json'

    $.ajax $.extend defaults, options


  # ## open

  # generic method to open a store. Used by
  #
  # * hoodie.remote
  # * hoodie.user("joe")
  # * hoodie.global
  # * ... and more
  # 
  # usage: `hoodie.open("some_store_name").findAll()`
  #
  open : (store_name, options = {}) ->
    $.extend options, name: store_name
    new Hoodie.Remote this, options


  # ## Defer

  # returns a defer object for custom promise handlings
  defer: $.Deferred
  

  # ## Utils

  # helper to generate uuids.
  uuid : (len = 7) ->
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')
    radix = chars.length
    (
      chars[ 0 | Math.random()*radix ] for i in [0...len]
    ).join('')
  
  # 
  isPromise: (obj) ->
    typeof obj?.done is 'function' and typeof obj.resolve is 'undefined'

  #
  promisify: (something) ->
    @defer().resolve(something).promise()
  

  # ## Private
  
  #
  _loadModules: (modules = @constructor.modules, context = this) ->

    for instanceName, moduleName of modules
        
      switch typeof moduleName
        when 'string'
          context[instanceName] = new Hoodie[moduleName] this
        when 'function'  
          context[instanceName] = new moduleName this
        else
          namespace = instanceName
          context[namespace] or= {}
          @_loadModules modules[namespace], context[namespace]