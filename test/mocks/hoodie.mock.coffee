window.Mocks or= {}

promiseMock = 
  pipe : ->
  fail : ->
  done : ->
  then : ->

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
      create        : -> promiseMock 
      destroy       : -> promiseMock 
      save          : -> promiseMock 
      update        : -> promiseMock 
      updateAll     : -> promiseMock 
      find          : -> promiseMock 
      findAll       : -> promiseMock
      findOrCreate  : -> promiseMock 
      delete        : -> promiseMock 
      destroyAll    : -> promiseMock 
      changedDocs   : ->
        
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
      owner         : 'owner_hash'
      
    config :
      set : ->
      get : ->
      remove : ->
      clear : ->