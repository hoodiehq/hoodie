#
# Sending emails. Not unicorns
#

class Hoodie.Email

  # ## Constructor
  #
  constructor : (@hoodie) ->
    
    # TODO
    # let's subscribe to general `_email` changes and provide
    # an `on` interface, so devs can listen to events like:
    # 
    # * hoodie.email.on 'sent',  -> ...
    # * hoodie.email.on 'error', -> ...
  
  # ## send
  #
  # sends an email and returns a promise
  send : (emailAttributes = {}) ->
    defer      = @hoodie.defer()
    attributes = $.extend {}, emailAttributes
    
    unless @_isValidEmail emailAttributes.to
      attributes.error = "Invalid email address (#{attributes.to or 'empty'})"
      return defer.reject(attributes).promise()
    
    @hoodie.store.add('$email', attributes).then (obj) =>
      @_handleEmailUpdate(defer, obj)
      
    defer.promise()
    
  # ## PRIVATE
  #
  _isValidEmail : (email = '') ->
     /@/.test email
     
  _handleEmailUpdate : (defer, attributes = {}) =>
    if attributes.error
      defer.reject attributes
    else if attributes.deliveredAt
      defer.resolve attributes
    else
      @hoodie.remote.one "updated:$email:#{attributes.id}", (attributes) => @_handleEmailUpdate(defer, attributes)



# extend Hoodie
Hoodie.extend 'email', Hoodie.Email