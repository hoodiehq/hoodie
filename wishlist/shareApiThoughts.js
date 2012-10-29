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
hoodie.share.find()
hoodie.share.findAll()
hoodie.share.findOrAdd()
hoodie.share.add()
hoodie.share.update()
hoodie.share.updateAll()
hoodie.share.remove()
hoodie.share.removeAll()

// on top, it allows a direct call:  
// that opens a share from remote and exposes a store API
// to directly interact with the store.
share = hoodie.share('shareId')

// you can also initiate a new share instance,
// the id gets auto generated if not passed
share = new hoodie.share


// Share Instance API
// --------------------

// a share provides a store for its objects
// all these methods make direct calls to the
// remote share store. If share is a new instance,
// it gets published automtically
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

// the hoodie.share module also extends the hoodie.store
// api with two methods: share and unshare
hoodie.store.find('task', '123').share( share.id )
hoodie.store.find('task', '123').unshare( share.id )

// compare to [store.publish / store.unpublish](public_user_stores2.html)

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
  /* now others can access the shared directly with
     hoodie.share( share.id ).store.findAll() */
})