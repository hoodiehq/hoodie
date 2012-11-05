// Share
// =======
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
// 
// compare to [store.publish / store.unpublish](public_user_stores2.html)
hoodie.store.find('task', '123').share()
hoodie.store.find('task', '123').shareAt( share.id)
hoodie.store.find('task', '123').unshare()
hoodie.store.find('task', '123').unshareAt( share.id )


// example
// ---------

// You can share one ore multiple objects right away with this
// piece of coude
var todolist = {
  title: 'shopping list',
  tasks: [
    {title: 'nutella'},
    {title: 'bread'},
    {title: 'milk'}
  ]
}
hoodie.store.add('todolist', todolist).share({write: true, password: 'secret'})
.done( function(todolist, share) {
  /* now others can access the shared directly with
     hoodie.share( share.id ).store.findAll() */
})


// Use cases
// -----------
//
// 1.  Public Share
// 2.  Private Share
// 5.  Read only Share
// 6.  Collaborative Shares
// 7.  Public, password protected shares
// 8.  Listen to events in Shares
//
// To be done:
//
// *   Subscribe to other users' shares


// ### Usecase 1: Public Share

// Let's say I've a todolist that I want to share 
// publicly with others with an secret URL. First we add the todolist
// (by passing an object with the respective type & id) and then
// the todolist will be available to others at the secret URL
//
hoodie.store.add('todolist', todolist).share()
.done( function(todolist, share) {
  share.grantReadAccess()
  share_url = "http://mytodoapp.com/shared/" + share.id;
  alert("Share your todolist at " + share_url);
})


// ### Usecase 2: Private Share

// Let's say I've another todolist that I want to share only 
// with my collegues aj@example.com and bj@example.com. I want the todolist to
// to be accessible for AJ, BJ and myself only.
//
hoodie.store.add('todolist', todolist).share()
.done( function(todolist, share) {
  share.grantReadAccess(["aj@example.com", "bj@example.com"])
  share_url = "http://mytodoapp.com/shared/" + share.id;
  alert("Share your todolist at " + share_url);
})



// ### Usecase 5: Read only Share

// If you want to prevent other users to make changes to your shared objects,
// grant read access. If another user will try to push to
// `hoodie.share("share_id")`, it will be rejected.
// 
hoodie.share.add()
.done( function(share) { 
  share.grantReadAccess()
})
hoodie.share( "share_id" ).push();


// ### Usecase 6: Collaborative Shares

// If you want to invite others to collaborate on your objects, you need
// to grant write access. Then all users knowing the 
// share.id will be able to push changes.
//
hoodie.share.add()
.done( function(share) { 
  share.grantWriteAccess()
})
hoodie.share( "share_id" ).push();


// ### Usecase 7: Public, password protected shares

// I can optionally assign a password to a share that needs to be provided by
// others when trying to accessing it:
hoodie.share.add( {  
  id : "mytodolist123"
  password : "secret"
}).done( function(share) {} )

// If other users want to access your share, they need to passt the password
// as option
hoodie.share( "mytodolist123", {password: "secret"} )
.store.findAll( function(objects) {
  alert("welcome to my todolist!");
});


// ### Usecase 8: Subscribing to events in Shares

// I can open a share and listen to changes of its containing objects
//
hoodie.share('shared_id').on('store:changed',        function(object) { /*...*/ });
hoodie.share('shared_id').on('store:changed:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('store:created',        function(object) { /*...*/ });
hoodie.share('shared_id').on('store:created:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('store:updated',        function(object) { /*...*/ });
hoodie.share('shared_id').on('store:updated:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('store:destroyed',      function(object) { /*...*/ });
hoodie.share('shared_id').on('store:destroyed:type', function(object) { /*...*/ });