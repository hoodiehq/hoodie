# UserStore
# ===========
#
# the User Store provides an API to load objects from other users that
# have been made available publicly.
#
# The syntax to load all objects from user "Joe" looks like this:
#
#     hoodie.user("joe").loadAll().done( handleObjects)
#

class Hoodie.UserStore

  constructor: (hoodie) ->

    # vanilla API syntax:
    # hoodie.user('joe').loadAll()
    return (username) -> 
      new Hoodie.UserStore.Instance(username, hoodie)


class Hoodie.UserStore.Instance

  constructor: (@username, @hoodie) ->

    #

  loadAll: ->

    # should send a request to:
    # http://#{baseUrl}/#{@username}%2Fpublic/_all_docs

    @_request = @hoodie.request 'GET', @_userPublicStoreUrl(), 
      contentType: 'application/json'


  # ## private

  _userPublicStoreUrl: () ->
    dbName = @username.toLowerCase().replace(/@/, "$").replace(/\./g, "_");
    "/#{encodeURIComponent dbName}/public/_all_docs"