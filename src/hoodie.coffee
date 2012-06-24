#
# Hoodie
# --------
#
# the door to world domination (apps)
#
define 'hoodie', ['hoodie/events'], (Events) ->
  
  # 'use strict'

  class Hoodie extends Events
  
    modules: ['hoodie/store', 'hoodie/config', 'hoodie/account', 'hoodie/remote', 'hoodie/email', 'hoodie/sharing'] 
  
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
    
    
    _ready_callbacks: []
    _ready: false
    ready: (callback) ->
      if @_ready
        callback()
      else
        @_ready_callbacks.push callback
    
    # ## Private
    
    #
    _load_modules: ->
      require @modules, (ModuleClasses...) =>
        for Module in ModuleClasses
          
          instance_name = Module.name.toLowerCase()
          @[instance_name] = new Module this
          
        cb(this) while cb = @_ready_callbacks.shift()
        @_ready = true