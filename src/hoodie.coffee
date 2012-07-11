#
# Hoodie
# --------
#
# the door to world domination (apps)
#
class Hoodie extends Events

  # modules to be loaded
  modules: ->
    store   : Hoodie.Store
    config  : Hoodie.Config
    account : Hoodie.Account
    remote  : Hoodie.Remote
    email   : Hoodie.Email


  # ## initialization
  #
  # Inits the Hoodie, an optional couchDB URL can be passed
  constructor : (@base_url = '') ->
  
    # remove trailing slash(es)
    @base_url = @base_url.replace /\/+$/, ''
    @_load_modules()
  

  # ## Request
  #
  # use this method to send AJAX request to the Couch.
  request: (type, path, options = {}) ->
    defaults =
      type        : type
      url         : "#{@base_url}#{path}"
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
  _load_modules: ->
    for instance_name, Module of @modules()
      @[instance_name] = new Module this