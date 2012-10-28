// Share (2nd thought)
// =====================
// 
// a share is like a store, give I'm permitted to access / modify the share
// I can add / find / update / remove objects


// Share Module API
// ------------------

// the hoodie.share module provides a store,
// which is special in two ways: 
// 
// 1. no type can be passed
// 2. returned objects are not objects, but share instances

// hoodie.share Module API:
hoodie.share.store.find()
hoodie.share.store.findAll()
hoodie.share.store.findOrAdd()
hoodie.share.store.add()
hoodie.share.store.update()
hoodie.share.store.updateAll()
hoodie.share.store.remove()
hoodie.share.store.removeAll()

// on top, it allows a direct call:
hoodie.share('shareId')
// that tries to find the share in the local
// store and in case it cannot be found, opens the share
// from remote

// you can also initiate a new share instance,
// the id gets auto generated if not passed
share = new hoodie.share


// Share Instance API
// --------------------

// a share provides a store for its objects
share.store.find()
share.store.findAll()
share.store.findOrAdd()
share.store.add()
share.store.update()
share.store.updateAll()
share.store.remove()
share.store.removeAll()

// publish / destroy the share
share.publish()
share.destroy()

// grant / revoke access
share.grantAccess()  // everybody can read
share.revokeAccess() // nobody but me has access
share.grantWriteAccess()  // everybody can write
share.revokeWriteAccess() // nobody but me can wirte
share.grantAccess("joe@example.com")
share.grantWriteAccess(["lisa@example.com", "judy@example.com"])
share.revokeAccess("lisa@example.com")


// Sharing objects from my store
// -------------------------------

// the hoodie.share module also extends the hoodie.share
// api with two methods: share and unshare
hoodie.store.share('task', '123', 'shareID')
hoodie.store.unshare('task', '123', 'shareID')

// or
hoodie.store.find('task', '123').share('shareId')
hoodie.store.find('task', '123').unshare('shareId')

// compare to (store.publish / store.conceal)[public_user_stores2.html]

// random thoughts
// -----------------

// I'd like to do something like this!
var todolist = {
  title: 'shopping list',
  tasks: [
    {title: 'nutella'},
    {title: 'bread'},
    {title: 'milk'}
  ]
}
hoodie.store.add('todolist', todolist).share({write: true, password: 'secret'})
.done( function(share) {
  // now others can access the shared obect with
  // hoodie.share( share.id ).store.findAll()
})