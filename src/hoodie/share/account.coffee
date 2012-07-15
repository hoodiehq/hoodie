# Account patched for Share.
# 
# Share does not use Cookies for authentication but the authorization header
# (basic authentication). Therefore sign up/in/out is ... useless.
#
  
# needs to to have the same name due to hoodie's loading mechanism
# see: Hoodie::_loadModules
class Hoodie.Share.Account extends Hoodie.Account

  constructor : ->
    super
    @_shareAuthPromise = @hoodie.defer().resolve(@username).promise()
    

  authenticate : -> @_shareAuthPromise
  signUp      : -> @_shareAuthPromise
  signIn      : -> @_shareAuthPromise
  signOut     : -> @_shareAuthPromise
