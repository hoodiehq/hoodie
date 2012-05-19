define 'mocks/bulk_update_response', ->
  ->
    [
      {
        id     : "todo/abc3"
        ok     : true
        rev    : "1-c7f19547b37274aa672663a5f995c33c"
      },       
      {        
        id     : "todo/abc2"
        error  : "conflict"
        reason : "Document update conflict."
      }
    ]