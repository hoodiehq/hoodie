#
# Hoodie
# --------
#
# the door to world domination (apps)
#
class Hoodie extends Events

  # modules to be loaded
  modules: ->
    my :
      store   : Hoodie.LocalStore
      config  : Hoodie.Config
      account : Hoodie.Account
      remote  : Hoodie.Account.RemoteStore

    user    : Hoodie.User
    global  : Hoodie.Global
    email   : Hoodie.Email
    share   : Hoodie.Share


  # ## initialization

  # Inits the Hoodie, an optional CouchDB URL can be passed
  constructor : (@baseUrl = '') ->

    # remove trailing slash(es)
    @baseUrl = @baseUrl.replace /\/+$/, ''
    @_loadModules()
  

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
  # * hoodie.my.remote
  # * hoodie.user("joe")
  # * hoodie.global
  # * ... and more
  #
  # usage: `hoodie.open("some_store_name").findAll()`
  #
  open : (store_name, options = {}) ->
    $.extend options, basePath: "/#{encodeURIComponent store_name}"
    new Hoodie.RemoteStore this, options


  # ## Defer

  # returns a defer object for custom promise handlings
  defer: $.Deferred
  

  # ## Utils
  
  isPromise: (obj) ->
    typeof obj?.done is 'function' and typeof obj.resolve is 'undefined'
  

  # ## Private
  
  #
  _loadModules: (context = this, modules = @modules()) ->

    for instanceName, Module of modules
      
      if typeof Module is 'function'
        context[instanceName] = new Module this
        
      else
        namespace = instanceName
        context[namespace] or= {}
        @_loadModules context[namespace], modules[namespace]
      ###