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

    # extend hodie.store promise API
    @hoodie.store.decoratePromises
      publish   : @_storePublish
      unpublish : @_storeUnpublish

    # vanilla API syntax:
    # hoodie.user('uuid1234').findAll()
    return (userHash, options = {}) => 
      $.extend options, prefix: '$public'
      @hoodie.open "user/#{userHash}/public", options


  # hoodie.store decorations
  # --------------------------
  # 
  # hoodie.store decorations add custom methods to promises returned
  # by hoodie.store methods like find, add or update. All methods return
  # methods again that will be executed in the scope of the promise, but
  # with access to the current hoodie instance

  # publish
  # 
  # publish an object. If an array of properties passed, publish only these
  # attributes and hide the remaining ones. If no properties passed, publish
  # the entire object.
  _storePublish : (properties) ->
    @pipe (objects) =>
      objects = [objects] unless $.isArray objects
      for object in objects
        @hoodie.store.update object.type, object.id, $public: properties or true
  
  # `unpublish`
  # 
  # unpublish
  _storeUnpublish : ->
    @pipe (objects) =>
      objects = [objects] unless $.isArray objects
      for object in objects when object.$public
        @hoodie.store.update object.type, object.id, $public: false


# extend Hoodie
Hoodie.extend 'user', Hoodie.User