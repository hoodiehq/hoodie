// hoodie.share API
// ==================
// 
// a share is like a store, give I'm permitted to access / modify the share
// I can insert / find / update / remove objects

// Share Instance API
// --------------------

// initiate a new share
share = new hoodie.share({access: true})


// open an existing share (local or remote)
share = hoodie.share('shareId')

// a share provides a store for its objects
share.store.find()
share.store.findAll()
share.store.findOrInsert()
share.store.insert()
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
hoodie.share.store.findOrInsert()
hoodie.share.store.insert()
hoodie.share.store.update()
hoodie.share.store.updateAll()
hoodie.share.store.remove()
hoodie.share.store.removeAll()

// on top, there two extra methods.
// The first opens a remote store
hoodie.share.open('shareId')
// the second tries to find the share in the local
// store and in case it cannot be found, opens the share
// from remote
hoodie.share('shareId')