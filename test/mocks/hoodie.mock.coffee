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
      create        : -> 
        then : ->
      destroy       : -> 
        then : ->
      save          : -> 
        then : ->
        done: ->
      update        : -> 
        pipe : ->
        fail : ->
        done : ->
      load          : -> 
        pipe : ->
        fail : ->
        done : ->
      changed_docs  : ->
        
      db :
        getItem       : ->
        setItem       : ->
        removeItem    : ->
                    
    account       : 
      authenticate  : -> then : ->   
      db       : ->
      on            : ->
        
    config :
      set : ->
      get : ->
      remove : ->