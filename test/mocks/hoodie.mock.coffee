window.Mocks or= {}

promiseMock = 
  pipe : ->
  fail : ->
  done : ->
  then : ->

Mocks.Hoodie = ->
  
  baseUrl : 'http://my.cou.ch'
  
  trigger       : Hoodie::trigger
  request       : ->
  checkConnection : ->
  open          : ->
  on            : Hoodie::on
  one           : Hoodie::one
  unbind        : Hoodie::unbind
  defer         : $.Deferred
  isPromise     : Hoodie::isPromise
  uuid          : -> 'uuid'
  resolveWith   : -> 'resolved'
  rejectWith    : -> 'rejected'
    
  store         :
    add           : -> promiseMock 
    remove        : -> promiseMock 
    save          : -> promiseMock 
    update        : -> promiseMock 
    updateAll     : -> promiseMock 
    find          : -> promiseMock 
    findAll       : -> promiseMock
    findOrAdd     : -> promiseMock 
    removeAll     : -> promiseMock 
    changedObjects   : ->
    isDirty       : ->
    decoratePromises: -> 
      
    db :
      getItem       : ->
      setItem       : ->
      removeItem    : ->
                
  account       : 
    authenticate    : -> promiseMock
    db              : ->
    on              : ->
    ownerHash       : 'owner_hash'
    hasAccount      : ->
    anonymousSignUp : ->
    
  config :
    set : ->
    get : ->
    remove : ->
    clear : ->

  remote :
    connect     : ->
    disconnect  : ->
    sync        : ->
    on          : ->
    one         : ->
    trigger     : ->

  share :
    add         : -> promiseMock 
    remove      : -> promiseMock 
    save        : -> promiseMock 
    update      : -> promiseMock 
    updateAll   : -> promiseMock 
    find        : -> promiseMock 
    findAll     : -> promiseMock
    findOrAdd   : -> promiseMock 
    removeAll   : -> promiseMock 
    request     : -> promiseMock 
