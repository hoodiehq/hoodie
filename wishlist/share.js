// Share
// ==========

// To showcase the share module, its settings and API, we'll take an todo app
// as example. I can create multiple todo lists with it and can share these.

// ## Share options
// 
// * access     (default: false)
// * continuous (default: false)
// * password   (default: _no password_)

// ### the `access` setting (default: false)

// access: false (default)
hoodie.share.create().done( function(share) {
  /* Nobody but me can access the todolist, until I make the share public
     or invite readers / writers to it. */
  share.add(todolist).push()
})

// access: true
hoodie.share.create( {access: true} ).done( function(share) {
  /* Everybody will be able to acces and edit the todo list */
  share.add(todolist).push()
})

// access: [user1, user2]
hoodie.share.create( {access: ['aj@foo.com', 'bj@foo.com']} )
.done( function(share) {
  /* Besides me, only AJ and BJ will have access to the todolist */
  share.add(todolist).push()
})

// access: {read: true}
hoodie.share.create({access: {read: true}}).done( function(share) {
  /* Everybody will be able to acces the todo list, but only I can edit it */
  share.add(todolist).push()
})

// access: {read: true, write: [user1, user2]}
hoodie.share.create({
  access: {
    write: ['aj@foo.com', 'bj@foo.com']
  }
}).done( function(share) {
  /* Everybody will be able to acces the todo list, 
     but only AJ, BJ and me can edit it */
  share.add(todolist).push()
})

// access: {read: [user1, user2], write: [user3]}
hoodie.share.create({
  access: {
    read:  ['aj@foo.com', 'bj@foo.com']
    write: ['cj@foo.com']
  }
}).done( function(share) {
  /* Besides me, only AJ, BJ and CJ will have access to the todolist
     and only CJ and me can edit it */
  share.add(todolist).push()
})


// ### the `continuous` setting

// continuous: false (default)
hoodie.share.create().done( function(share) {
  /* I need push my changes manually */
  share.add(todolist)
  share.push()
})

// continuous: true (default)
hoodie.share.create().done( function(share) {
  /* changes get synchronized continuously, no need to push / pull them */
  share.add(todolist)
})

// ### the `password` setting

// password not set (default)
hoodie.share.create({access: true}).done( function(share) {
  /* everybody can access the share with the share.id */
})

// password set to "secret"
hoodie.share.create({access: true, password: "secret"}).done( function(share) {
  /* Others will need both the share.id and the password
     in order to access the share */
})

// ## Share API

// * create  
//   create a new share
hoodie.share.create({})

// * save  
//   save a share, overwrites all settings if share existed before
hoodie.share.save("share_id", {})

// * update    
//   update an existing setting, only passed attributes get changed
hoodie.share.update("share_id", {})

// * delete    
//   deletes a share, unshares all its objects
hoodie.share.delete("share_id")

// * open    
//   opens a share, gives access to its objects, etc
hoodie.share.open("share_id")

// * add    
//   add object(s) to the share
hoodie.share.add("share_id", object)
hoodie.share.add("share_id", [object1, object2])

// * remove  
//   remove object(s) from the share
hoodie.share.remove("share_id", object)
hoodie.share.remove("share_id", [object1, object2])

// * push  
//   push local changes to share
hoodie.share.push("share_id")

// * pull  
//   pull changes from the share
hoodie.share.pull("share_id")

// * sync  
//   push & pull changes of the share
hoodie.share.sync("share_id")



// ## Use cases
// 
// 1.  Public Share
// 2.  Private Share
// 3.  Continuous Share
// 4.  Manual Share
// 5.  Read only Share
// 6.  Collaborative Shares
// 7.  Public, password protected shares
// 8.  Subscribe to a Share
// 9.  Subscribing to events in Shares
// 
// To be done:
// 
// *   Change settings (e.g. collaborators) after the share has been created
// *   Differentiate between anonymous users and users with accounts?
// *   user group access?


// ### Usecase 1: Public Share

// Let's say I've a todolist that I want to share 
// publicly with others with an secret URL. First we add the todolist
// (by passing an object with the respective type & id) and the we
// push the todolist will be available to others at the secret URL
// 
hoodie.share.create({public: true})
.done( function(share) {
  
  share.add(todolist).push()
  .done( function() {
    share_url = "http://mytodoapp.com/shared/" + share.id
    alert("Share your todolist at " + share_url)
  })
})


// ### Usecase 2: Private Share

// Let's say I've another todolist that I want to share only 
// with my collegues aj@example.com and bj@example.com. I want the todolist to
// to be accessible for AJ, BJ and myself only.
// 
hoodie.share.create({collaborators: ["aj@example.com", "bj@example.com"]})
.done( function(share) {
  share.add(todolist)

  share_url = "http://mytodoapp.com/shared/" + share.id
  alert("AJ and BJ can access the todolist at " + share_url)
})


// ### Usecase 3: Continuous Share

// If you don't want to manually pull and push changes of shared objects, you
// can set the share to be continuous. 
hoodie.share.create( {continuous: true} )
.done( function(share){

  // * added todolists will be synched right away
  share.add(todolist)

  // * changes to added todolists will be synched right away
  hoodie.store.update(todolist, {name: "new name"})

  // * removed docs will be removed from the share right away
  share.remove(todolist)
})


// ### Usecase 4: Manual Share

// Manual share means you have to manually push and pull changes of shared
// objects, it's the default behavior. Each of the following methods returns
// a promise
// 
hoodie.share.push("share_id")
hoodie.share.pull("share_id")
hoodie.share.sync("share_id")


// ### Usecase 5: Read only Share

// Shares are read only be default. This means others can see the shared
// objects (if they have access), but they cannot make changes to them, or 
// to be precise, they cannot push their local changes
// 

/* will fail for other users */
hoodie.share.open( "share_id" ).push()


// ### Usecase 6: Collaborative Shares

// If I want to invite others to collaborate on my objects, I need to set the
// collaborative setting to true
// 
hoodie.share.create( {collaborative: true} )
.done( function(share){
  // others will be able to push their changes on the todolist and its todos
  share.add([todolist, todo1, todo2, todo3]).push() 
})


// ### Usecase 7: Public, password protected shares

// I can optionally assign a password to a share that needs to be provided by
// others when trying to accessing it:
/* me */
hoodie.share.create( { 
  acess    :true, 
  password : "secret"
}).push()

/* they */
hoodie.share.open( "mytodolist123", {password: "secret"} )
.done( function() {
  alert("welcome to my todolist!")
})

// ### Usecase 8: Share Subscriptions

// I can subscribe to a share by others. It can be used just like the `open`
// method, with the difference that an internal $shareAccess object will be 
// added to my store. This allows me to get a list of all shares I've access 
// to.
hoodie.share.subscription.create("share_id")

/* or */
hoodie.share.open( "share_id" ).done( function(share) {
  share.subscribe()
})

// I can pass options when creating a subscription, like password for protected
// shares or continuous if I want to continuously synchronize with the 
// share 
hoodie.share.subscription.create("share_id", {
  continuous: true,
  password: "secret"
})


// ### Usecase 9: Subscribing to events in Shares

// I can open a share and listen to changes of its containing objects
// 
app.share.open( "shared_id" ).done( function(share) {
  share.on('changed',        function(object) { /* ... */ })
  share.on('changed:type',   function(object) { /* ... */ })
  share.on('created',        function(object) { /* ... */ })
  share.on('created:type',   function(object) { /* ... */ })
  share.on('updated',        function(object) { /* ... */ })
  share.on('updated:type',   function(object) { /* ... */ })
  share.on('destroyed',      function(object) { /* ... */ })
  share.on('destroyed:type', function(object) { /* ... */ })
})