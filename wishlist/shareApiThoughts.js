// hoodie.share API
// ------------------
// 

// a share is like a store, as long as I'm permitted, I can insert new objects,
// find objects, destroy, etc.
// 
// But besides the store API, shares themselves are also objects ($type = $share).
// So besides the store API, we also need an API to create a new share, update
// its settings and destroy it again.

// initiate a new share
share = new hoodie.share({access: true})

// open an existing share (local or remote)
share = hoodie.share('shareId')

// a share is a store. So it provides all the store APIs
share.find()
share.findAll()
share.findOrInsert()
share.insert()
share.update()
share.updateAll()
share.remove()
share.removeAll()

// on top of that, it has some extra methods, to change
// it settings, add/remove objects, and to destroy it.
share.setAccess()
share.add()
share.remove()
share.destroy()

// the hoodie.store module itself is also some kind of
// store, namespaced to objects of type: "$share". 
// For example:
hoodie.share.find('shareId')
// is equal to 
hoodie.store.find('$share', 'shareId')
// besides it not only returns an object, but a share instance

// entire hoodie.share API:
hoodie.share.find()
hoodie.share.findAll()
hoodie.share.findOrInsert()
hoodie.share.insert()
hoodie.share.update()
hoodie.share.updateAll()
hoodie.share.destroy()
hoodie.share.destroyAll()

// on top, there two extra methods.
// The first opens a remote store
hoodie.share.open('shareId')
// the second tries to find the share in the local
// store and in case it cannot be found, opens the share
// from remote
hoodie.share('shareId')