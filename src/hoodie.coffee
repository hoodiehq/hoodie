# Hoodie
# --------
#
# the door to world domination (apps)
#

class Hoodie extends Events
  

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
      @baseUrl = location.protocol + "//api." + location.hostname.replace(/^www\./, '')

    # init core modules 
    @store   = new @constructor.LocalStore this
    @config  = new @constructor.Config this
    @account = new @constructor.Account this
    @remote  = new @constructor.AccountRemote this

    # init extensions
    @_loadExtensions()
  

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