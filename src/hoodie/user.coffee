# User
# ======

# the User Module provides a simple API to find objects from other users public
# stores
#
# For example, the syntax to find all objects from user "Joe" looks like this:
#
#     hoodie.user("Joe").findAll().done( handleObjects )
#
class Hoodie.User

  constructor: (@hoodie) ->

    # vanilla API syntax:
    # hoodie.user('uuid1234').findAll()
    return (userHash) => 
      @hoodie.open "user/#{userHash}/public"