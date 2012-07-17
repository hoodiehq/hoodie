# User
# ======

# the User Module provides a simple API to load objects from other users public
# stores
#
# For example, the syntax to load all objects from user "Joe" looks like this:
#
#     hoodie.user("Joe").loadAll().done( handleObjects)
#
class Hoodie.User

  constructor: (hoodie) ->

    # vanilla API syntax:
    # hoodie.user('joe').loadAll()
    return (username) => 
      hoodie.open @_userPublicStoreName(username)

  _userPublicStoreName: (username) ->
    dbName = username.toLowerCase().replace(/@/, "$").replace(/\./g, "_");
    "#{dbName}/public"