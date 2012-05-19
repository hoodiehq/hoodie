#
# Connection / Socket to our couch
#
# Remote is using couchDB's `_changes` feed to listen to changes
# and `_bulk_docs` to push local changes
#

define 'email', ['errors'], (ERROR) ->
  
  # 'use strict'
  
  class Email
  
    # ## Constructor
    #
    constructor : (@app) ->
      
      # TODO
      # let's subscribe to general `_email` changes and provide
      # an `on` interface, so devs can listen to events like:
      # 
      # * app.email.on 'sent',  -> ...
      # * app.email.on 'error', -> ...
    
    # ## send
    #
    # sends an email and returns a promise
    send : (email_attributes = {}) ->
      defer      = @app.defer()
      attributes = $.extend {}, email_attributes
      
      unless @_is_valid_email email_attributes.to
        attributes.error = "Invalid email address (#{attributes.to or 'empty'})"
        return defer.reject(attributes).promise()
      
      @app.store.create('$email', attributes).then (obj) =>
        @_handle_email_update(defer, obj)
        
      defer.promise()
      
    # ## PRIVATE
    #
    _is_valid_email : (email = '') ->
       /@/.test email
       
    _handle_email_update : (defer, attributes = {}) =>
      if attributes.error
        defer.reject attributes
      else if attributes.delivered_at
        defer.resolve attributes
      else
        @app.one "remote:updated:$email:#{attributes.id}", (attributes) => @_handle_email_update(defer, attributes)