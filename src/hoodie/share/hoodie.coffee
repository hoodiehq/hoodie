# ## ShareHoodie
#
# ShareHoodie is a subset of the original Hoodie class and used for
# "manual" share, when user is not signed up yet.
#
class Hoodie.Share.Hoodie extends Hoodie
  
  modules : ->

    my :
      account : Hoodie.Share.Account
      remote  : Hoodie.Share.Remote
  
  constructor: (hoodie, @share) ->
    # proxy hoodie.config to the share object
    @my =
      store  : hoodie.my.store
      config :
        set    : @share.set
        get    : @share.get
        remove : @share.set
    
    # depending on whether share is continuous, we start
    # continuous synching ... or not.
    @my.config.set '_account.username', "share/#{@share.id}"
    @my.config.set '_account.owner',    hoodie.my.account.owner
    @my.config.set '_remote.active',    @share.continuous is true
    
    # proxy certain events from core hoodie
    for event in ['store:dirty:idle']
      hoodie.on event, => @trigger event

    super hoodie.baseUrl

  # ## ShareHoodie Request
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
      
    unless type is 'PUT' # no authentication header for "signup" request
      hash = btoa "share/#{@share.id}:#{@share.password or ''}"
      auth = "Basic #{hash}"
      
      $.extend defaults,
        headers     :
          Authorization : auth
    
    $.ajax $.extend defaults, options