# Account patched for Sharing.
# 
# Sharing does not use Cookies for authentication but the authorization header
# (basic authentication). Therefore sign up/in/out is ... useless.
#
  
# needs to to have the same name due to hoodie's loading mechanism
# see: Hoodie::_loadModules
class Hoodie.Sharing.Account extends Hoodie.Account

  constructor : ->
    super
    @_sharingAuthPromise = @hoodie.defer().resolve(@username).promise()
    

  authenticate : -> @_sharingAuthPromise
  signUp      : -> @_sharingAuthPromise
  signIn      : -> @_sharingAuthPromise
  signOut     : -> @_sharingAuthPromise
