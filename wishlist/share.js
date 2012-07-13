// Share
// ==========

// A share has 3 main paramters, that can be combined with each other:
// 
//     private:       true || false
//     continuous:    true || false
//     collaborative: true || false
// 
// As examples we take a todo app where I can create muliple todo lists that 
// can be shared in different ways. We'll make uses case for each possible
// share setting:
// 
// 1. Public Share
// 
//    I've created stuff that I want to share with anybody, through a secret
//    URL.
// 
// 2. Private Share
// 
//    I've created stuff that I want to share with specific other accounts.
// 
// 3. Continuous Share
// 
//    I want updates to my shared objects to be continuously synchronized.
//    If I made a change I want it to be pushed immediately and if one of
//    the collaborators made a change I want his changes to appear immediately
//    in my store.
// 
// 4. Manual Share
// 
//    I want to work on objects that are shared and then manually synchronize
//    the changes whenever I want to
// 
// 5. Read only Share
// 
//    By default, my shared objects should be read only to others.
// 
// 6. Collaborative Shares
//  
//    I want to enable Collaborators to make changes on shares. On both,
//    private and public shares.
// 
// 7. Public, password protected shares
// 
//    Same as 1., but besides the secret URL, the users need to know the
//    a password to access the shared objects
// 
// 8. Subscribe to a Share
// 
//    Persistent access to shares by others
// 
// 9. Subscribing to events in Shares
// 
//    

// Share objects
// -----------------

// A share has its own internal object, used only by hoodie. To create a
// new share with default settings, use this syntax:
hoodie.share.create().done( function(share) {
  // share instance initiated, ready to add/remove objects
})

// Shares are a special (hidden) type of hoodie objects, identified by 
// the `$share` type. In general, objects of types starting with a `$`
// are hidden objects, mostly used to trigger actions in the workers.
// 
// 
{
  id            : "abc4567",
  type          : "$share",
  private       : false,
  continuous    : false,
  collaborative : false,

  created_at    : "2012-03-29T20:01:58.331Z",
  updated_at    : "2012-03-29T20:01:58.331Z" 
}

// To add one or multiple objects to a share, use the `add` method. Use the
// `remove` method to unshare documents again
hoodie.share.open("share_id").done( function(share) {
  share.add([todolist1, todolist2])
  share.remove([todolist3])
})

// Shared documents are not available to others automatically. They need to be
// synchronized manually by calling the `push` methdod on `hoodie.share` or
// the share instance itself. There are also `pull` and `sync` methods, if
// you want to update shared objects from other users.
hoodie.share.push("share_id")
hoodie.share.open("share_id").done( function(share) {
  share.push()
})


// ### Usecase 1: Public Share

// Let's say we have a todolist with id "tl11111" that we want to share 
// publicly with others with an secret URL. First we add the todolist
// (by passing an object with the respective type & id) and the we
// push the todolist will be available to others at the secret URL
// 
hoodie.share.create({public: true})
.done( function(share) {
  
  share.add({type: "todolist", id: "tl11111"}).push()
  .done( function() {
    share_url = "http://mytodoapp.com/shared/" + share.id
    alert("Share your todolist at " + share_url)
  })
})


// ### Usecase 2: Private Share

// Let's say I've another todolist with id "ptl2222" that I want to share only 
// with my collegues aj@example.com and bj@example.com. I want the todolist to
// to be accessible for AJ, BJ and myself only.
// 
hoodie.share.create({collaborators: ["aj@example.com", "bj@example.com"]})
.done( function(share) {
  share.add({type: "todolist", id: "tl11111"})

  share_url = "http://mytodoapp.com/shared/" + share.id
  alert("AJ and BJ can access the todolist at " + share_url)
})


// ### Usecase 3: Continuous Share

// If you don't want to manually pull and push changes of shared objects, you
// can set the share to be continuous
hoodie.share.create( {continuous: true} )
.done( function(share){
  hoodie.store.load("todolist", id: "tl11111")
  .done( function(todolist) {
    // added todolists will be synched right away
    share.add(todolist)
    // changes to added todolists will be synched right away
    hoodie.store.update(todolist, {name: "new name"})
  })
})


// ### Usecase 4: Manual Share

// Manual share means you have to manually push and pull changes of shared
// objects, it's the default behavior. Each of the following methods returns
// a promise
// 
hoodie.share.push("share_id")
hoodie.share.pull("share_id")
hoodie.share.sync("share_id") // push & pull


// ### Usecase 5: Read only Share

// Shares are read only be default. This means others can see the shared
// objects (if they have access), but they cannot make changes to them, or 
// to be precise, they cannot push their local changes
// 
hoodie.share.push( "share_id" ) // will fail for other users


// ### Usecase 6: Collaborative Shares

// If I want to invite others to collaborate on my objects, I need to set the
// collaborative setting to true
// 
hoodie.share.create( {collaborative: true} )
.done( function(share){
  // others will be able to push their changes on todolist1 and its todos
  share.add([todolist1, todo1, todo2, todo3]).push() 
})


// ### Usecase 7: Public, password protected shares

// I can optionally assign a password to a share that needs to be provided by
// others when trying to accessing it:
/* me */
hoodie.share.create( { 
  id       :"mytodolist123", 
  public   :true, 
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