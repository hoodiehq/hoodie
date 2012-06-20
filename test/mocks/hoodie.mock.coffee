define 'mocks/hoodie', ->
    
  class HoodieMock
    base_url : 'http://my.cou.ch'
    
    trigger       : ->
    request       : ->
    on            : ->
    one           : ->
    unbind        : ->
    defer         : $.Deferred
    isPromise     : -> 
      
    store         :
      uuid          : -> 'mock567'
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
      authenticate  : -> 
        then : ->   
        pipe : ->   
          fail : ->
      db            : ->
      on            : ->
        
    config :
      set : ->
      get : ->
      remove : ->