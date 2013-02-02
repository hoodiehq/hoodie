#
# one place to rule them all!
#

Hoodie.Errors = 
    
  # ## INVALID_KEY
  #
  # thrown when invalid keys are used to store an object
  #
  INVALID_KEY : (idOrType) ->
    key = if idOrType.id then 'id' else 'type'
    new Error "invalid #{key} '#{idOrType[key]}': numbers and lowercase letters allowed only"

  # ## INVALID_ARGUMENTS
  #
  INVALID_ARGUMENTS : (msg) ->
    new Error msg

  # ## NOT_FOUND
  #
  NOT_FOUND : (type, id) ->
    new Error "#{type} with #{id} could not be found"
