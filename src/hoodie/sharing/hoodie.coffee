define 'hoodie/sharing/hoodie', ['hoodie'], (Hoodie) ->
      
  # ## SharingHoodie
  #
  # SharingHoodie is a subset of the original Hoodie class and used for
  # "manual" sharing, when user is not signed up yet.
  #
  class SharingHoodie extends Hoodie
    
    modules: ['hoodie/account', 'hoodie/remote'] 
    
    constructor: (hoodie, @sharing) ->
      @store  = hoodie.store
      
      # config is directly stored on the sharing document
      @config = @sharing.config
      
      # depending on whether sharing is continuous, we activate
      # continuous synching ... or not.
      @config.set 'remote.active', @sharing.continuous is true
      
      super(hoodie.base_url)
      
    # ## SharingHoodie Request
    #
    # the only difference to Hoodies default request:
    # we send the creds directly as authorization header
    request: (type, path, options = {}) ->
      
      # ignore requests to /_session as we don't use cookie authentication anyway, 
      # every request is authenticated by basic auth header
      if path is '/_session'
        @defer().resolve().promise()
      
      defaults =
        type        : type
        url         : "#{@base_url}#{path}"
        xhrFields   : withCredentials: true
        crossDomain : true
        dataType    : 'json'
        
      unless type is 'PUT' # no authentication header for sign up request
        console.log "hash: ", "sharing/#{@sharing.id}:#{@sharing.password}", @sharing
        hash = btoa "sharing/#{@sharing.id}:#{@sharing.password}"
        auth = "Basic #{hash}"
        
        $.extend defaults,
          headers     :
            Authorization : auth
      
      $.ajax $.extend defaults, options
