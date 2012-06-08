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
      @config = sharing.config
      super(hoodie.base_url)
      
    # ## SharingHoodie Request
    #
    # the only difference to Hoodies default request:
    # we send the creds directly as authorization header
    request: (type, path, options = {}) ->
      
      defaults =
        type        : type
        url         : "#{@base_url}#{path}"
        xhrFields   : withCredentials: true
        crossDomain : true
        dataType    : 'json'
      
      console.log "@account.username", @account.username
      if @account.username
        console.log "hash: ", "sharing/#{@sharing.id}:#{@sharing.password}"
        hash = btoa "sharing/#{@sharing.id}:#{@sharing.password}"
        auth = "Basic #{hash}"
        
        $.extend defaults,
          headers     :
            Authorization : auth
      
      $.ajax $.extend defaults, options