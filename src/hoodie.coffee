#
# Hoodie
# --------
#
# the door to world domination (apps)
#
class Hoodie extends Events

  # modules to be loaded
  modules:
    my :
      localStore  : "LocalStore"
      config      : "Config"
      account     : "Account"
      remoteStore : "RemoteStore"

    email   : "Email"
    sharing : "Sharing"


  # ## initialization
  #
  # Inits the Hoodie, an optional CouchDB URL can be passed
  constructor : (@baseUrl = '') ->
  
    # remove trailing slash(es)
    @baseUrl = @baseUrl.replace /\/+$/, ''
    @_loadModules()
  

  # ## Request
  #
  # use this method to send AJAX request to the Couch.
  request: (type, path, options = {}) ->
    defaults =
      type        : type
      url         : "#{@baseUrl}#{path}"
      xhrFields   : withCredentials: true
      crossDomain : true
      dataType    : 'json'

    $.ajax $.extend defaults, options
  

  # ## Promise
  #
  # returns a promise skeletton for custom promise handlings
  defer: $.Deferred
  

  # ## Utils
  
  isPromise: (obj) ->
    typeof obj.done is 'function' and typeof obj.fail is 'function'
  

  # ## Private
  
  #
  _loadModules: (context = this, modules = @modules) ->
    for instanceName, moduleName of modules
      
      if typeof moduleName is 'string'
        context[instanceName] = new Hoodie[moduleName] this
      else
        namespace = instanceName
        context[namespace] = {}
        @_loadModules context[namespace], modules[namespace]
      ###