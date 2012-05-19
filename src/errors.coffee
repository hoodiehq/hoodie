#
# one place to rule them all!
#

define "errors", ->  
  
  # 'use strict'
  
  errors =
    
    # ## INVALID_KEY
    #
    # thrown when invalid keys are used to store an object
    #
    INVALID_KEY:(id_or_type) ->
      key = if id_or_type.id then 'id' else 'type'
      new Error "invalid #{key} '#{id_or_type[key]}': numbers and lowercase letters allowed only"
  
    # ## INVALID_ARGUMENTS
    #
    INVALID_ARGUMENTS: (msg) ->
      new Error msg
  
    # ## NOT_FOUND
    #
    NOT_FOUND: (type, id) ->
      new Error "#{type} with #{id} could not be found"
