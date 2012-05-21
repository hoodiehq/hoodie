#
# Hoodie
# --------
#
# the door to world domination (apps)
#
define 'hoodie', ['hoodie/events', 'hoodie/store', 'hoodie/account', 'hoodie/remote', 'hoodie/email'], (Events, Store, Account, Remote, Email) ->
  
  # 'use strict'

  class Hoodie extends Events
  
  
    # ## initialization
    #
    # Inits the Hoodie, a couchDB URL needs to be passed
    constructor : (@base_url) ->
    
      # remove trailing slash(es)
      @base_url = @base_url.replace /\/+$/, ''
    
      @store   = new Store   this
      @account = new Account this
      @remote  = new Remote  this
      @email   = new Email   this
      
    
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