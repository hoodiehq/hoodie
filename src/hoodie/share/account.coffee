# Account patched for Share.
# 
# Share does not use Cookies for authentication but the authorization header
# (basic authentication). Therefore sign up/in/out is ... useless.
#
class Hoodie.Share.Account extends Hoodie.Account

  constructor : (@hoodie) ->
  
    super
    @_shareAuthPromise = @hoodie.defer().resolve(@username).promise()

  authenticate : -> @_shareAuthPromise
  signIn       : -> @_shareAuthPromise
  signOut      : -> @_shareAuthPromise


  db : -> 
    @username
