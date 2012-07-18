window.Mocks or= {}
Mocks.Hoodie = ->
  
  baseUrl : 'http://my.cou.ch'
  
  trigger       : ->
  request       : ->
  on            : ->
  one           : ->
  unbind        : ->
  defer         : $.Deferred
  isPromise     : Hoodie::isPromise
    
  my :
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
      changedDocs  : ->
        
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