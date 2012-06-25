# Account patched for Sharing.
# 
# Sharing does not use Cookies for authentication but the authorization header
# (basic authentication). Therefore sign up/in/out is ... useless.
#

define 'hoodie/sharing/account', ['hoodie/account'], (Account) ->
  
  # 'use strict'
  
  # needs to to have the same name due to hoodie's loading mechanism
  # see: Hoodie::_load_modules
  class Account extends Account

    constructor : ->
      super
      @_sharing_auth_promise = @hoodie.defer().resolve(@username).promise()
      

    authenticate : -> @_sharing_auth_promise
    sign_up      : -> @_sharing_auth_promise
    sign_in      : -> @_sharing_auth_promise
    sign_out     : -> @_sharing_auth_promise
