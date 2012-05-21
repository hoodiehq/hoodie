define 'mocks/hoodie', ->
    
  class HoodieMock
    base_url : 'http://my.cou.ch'
    
    trigger       : ->
    request       : ->
    on            : ->
    one           : ->
    unbind        : ->
    defer         : $.Deferred
      
    store         :
      create        : -> then : ->
      destroy       : -> then : ->
      save          : -> then : ->
      changed_docs  : ->
        
      db :
        getItem       : ->
        setItem       : ->
        removeItem    : ->
                    
    account       : 
      authenticate  : -> then : ->   
      user_db       : ->
      on            : ->