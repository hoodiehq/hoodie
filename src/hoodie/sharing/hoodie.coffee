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
      
      super(hoodie.base_url)
      
    # ## SharingHoodie Request
    #
    # the only difference to Hoodies default request:
    # we send the creds directly as authorization header
    request: (type, path, options = {}) ->
      
      # ignore requests to /_session as we don't use cookie authentication anyway, 
      # every request is authenticated by basic auth header
      #
      # we also ignore it, as hoodie.remote starts synching when session is successful.
      return if path is '/_session'
      
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
