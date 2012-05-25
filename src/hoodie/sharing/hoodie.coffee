define 'hoodie/sharing/hoodie', ['hoodie'], (Hoodie) ->
      
      
  # ## SharingHoodie
  #
  # SharingHoodie is a subset of the original Hoodie class and used for
  # "manual" sharing, when user is not signed up yet.
  #
  class SharingHoodie extends Hoodie
    
    modules: ['hoodie/account', 'hoodie/remote'] 
    
    constructor: (hoodie, sharing) ->
      @config = sharing.config
      @store  = hoodie.store
      super(hoodie.base_url)