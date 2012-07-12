# ## SharingHoodie
#
# SharingHoodie is a subset of the original Hoodie class and used for
# "manual" sharing, when user is not signed up yet.
#
class Hoodie.Sharing.Hoodie extends Hoodie
  
  modules : ->
    account : Hoodie.Sharing.Account
    remote  : Hoodie.Sharing.Remote
  
  constructor: (hoodie, @sharing) ->
    @store  = hoodie.store
    
    # proxy config to the sharing object
    @config =
      set    : @sharing.set
      get    : @sharing.get
      remove : @sharing.set
    
    # depending on whether sharing is continuous, we activate
    # continuous synching ... or not.
    @config.set '_account.username', "sharing/#{@sharing.id}"
    @config.set '_remote.active',    @sharing.continuous is true
    
    # proxy certain request from core hoodie
    for event in ['store:dirty:idle']
      hoodie.on event, => @trigger event

    super hoodie.baseUrl

  # ## SharingHoodie Request
  #
  # the only difference to Hoodies default request:
  # we send the creds directly as authorization header
  request: (type, path, options = {}) ->
    
    defaults =
      type        : type
      url         : "#{@baseUrl}#{path}"
      xhrFields   : withCredentials: true
      crossDomain : true
      dataType    : 'json'
      
    unless type is 'PUT' # no authentication header for sign up request
      hash = btoa "sharing/#{@sharing.id}:#{@sharing.password or ''}"
      auth = "Basic #{hash}"
      
      $.extend defaults,
        headers     :
          Authorization : auth
    
    $.ajax $.extend defaults, options

  _loadModules: ->
    console.log 'Hoodie.Sharing.Hoodie _loadModules'
    super