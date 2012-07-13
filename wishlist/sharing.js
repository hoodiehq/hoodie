// Sharing
// ==========

// A sharing has 3 main paramters, that can be combined with each other:
// 
//     private:       true || false
//     continuous:    true || false
//     collaborative: true || false
// 
// As examples we take a todo app where I can create muliple todo lists that 
// can be shared in different ways. We'll make uses case for each possible
// sharing setting:
// 
// 1. Public Sharing
// 
//    I've created stuff that I want to share with anybody, through a secret
//    URL.
// 
// 2. Private Sharing
// 
//    I've created stuff that I want to share with specific other accounts.
// 
// 3. Continuous Sharing
// 
//    I want updates to my shared objects to be continuously synchronized.
//    If I made a change I want it to be pushed immediately and if one of
//    the collaborators made a change I want his changes to appear immediately
//    in my store.
// 
// 4. Manual Sharing
// 
//    I want to work on objects that are shared and then manually synchronize
//    the changes whenever I want to
// 
// 5. Read only Sharing
// 
//    By default, my shared objects should be read only to others.
// 
// 6. Collaborative Sharings
//  
//    I want to enable Collaborators to make changes on sharings. On both,
//    private and public sharings.
// 
// 7. Public, password protected sharings
// 
//    Same as 1., but besides the secret URL, the users need to know the
//    a password to access the shared objects
// 
// 8. Subscribe to a Sharing
// 
//    Persistent access to sharings by others
// 
// 9. Subscribing to events in Sharings
// 
//    

// Sharing objects
// -----------------

// A sharing has its own internal object, used only by hoodie. To create a
// new sharing with default settings, use this syntax:
hoodie.sharing.create().done( function(sharing) {
  // sharing instance initiated, ready to add/remove objects
})

// Sharings are a special (hidden) type of hoodie objects, identified by 
// the `$sharing` type. In general, objects of types starting with a `$`
// are hidden objects, mostly used to trigger actions in the workers.
// 
// 
{
  id            : "abc4567",
  type          : "$sharing",
  private       : false,
  continuous    : false,
  collaborative : false,

  created_at    : "2012-03-29T20:01:58.331Z",
  updated_at    : "2012-03-29T20:01:58.331Z" 
}

// To add one or multiple objects to a sharing, use the `add` method. Use the
// `remove` method to unshare documents again
hoodie.sharing.open("sharing_id").done( function(sharing) {
  sharing.add([todolist1, todolist2])
  sharing.remove([todolist3])
})

// Shared documents are not available to others automatically. They need to be
// synchronized manually by calling the `push` methdod on `hoodie.sharing` or
// the sharing instance itself. There are also `pull` and `sync` methods, if
// you want to update shared objects from other users.
hoodie.sharing.push("sharing_id")
hoodie.sharing.open("sharing_id").done( function(sharing) {
  sharing.push()
})


// ### Usecase 1: Public Sharing

// Let's say we have a todolist with id "tl11111" that we want to share 
// publicly with others with an secret URL. First we add the todolist
// (by passing an object with the respective type & id) and the we
// push the todolist will be available to others at the secret URL
// 
hoodie.sharing.create({public: true})
.done( function(sharing) {
  
  sharing.add({type: "todolist", id: "tl11111"}).push()
  .done( function() {
    sharing_url = "http://mytodoapp.com/shared/" + sharing.id
    alert("Share your todolist at " + sharing_url)
  })
})


// ### Usecase 2: Private Sharing

// Let's say I've another todolist with id "ptl2222" that I want to share only 
// with my collegues aj@example.com and bj@example.com. I want the todolist to
// to be accessible for AJ, BJ and myself only.
// 
hoodie.sharing.create({collaborators: ["aj@example.com", "bj@example.com"]})
.done( function(sharing) {
  sharing.add({type: "todolist", id: "tl11111"})

  sharing_url = "http://mytodoapp.com/shared/" + sharing.id
  alert("AJ and BJ can access the todolist at " + sharing_url)
})


// ### Usecase 3: Continuous Sharing

// If you don't want to manually pull and push changes of shared objects, you
// can set the sharing to be continuous
hoodie.sharing.create( {continuous: true} )
.done( function(sharing){
  hoodie.store.load("todolist", id: "tl11111")
  .done( function(todolist) {
    // added todolists will be synched right away
    sharing.add(todolist)
    // changes to added todolists will be synched right away
    hoodie.store.update(todolist, {name: "new name"})
  })
})


// ### Usecase 4: Manual Sharing

// Manual sharing means you have to manually push and pull changes of shared
// objects, it's the default behavior. Each of the following methods returns
// a promise
// 
hoodie.sharing.push("sharing_id")
hoodie.sharing.pull("sharing_id")
hoodie.sharing.sync("sharing_id") // push & pull


// ### Usecase 5: Read only Sharing

// Sharings are read only be default. This means others can see the shared
// objects (if they have access), but they cannot make changes to them, or 
// to be precise, they cannot push their local changes
// 
hoodie.sharing.push( "sharing_id" ) // will fail for other users


// ### Usecase 6: Collaborative Sharings

// If I want to invite others to collaborate on my objects, I need to set the
// collaborative setting to true
// 
hoodie.sharing.create( {collaborative: true} )
.done( function(sharing){
  // others will be able to push their changes on todolist1 and its todos
  sharing.add([todolist1, todo1, todo2, todo3]).push() 
})


// ### Usecase 7: Public, password protected sharings

// I can optionally assign a password to a sharing that needs to be provided by
// others when trying to accessing it:
/* me */
hoodie.sharing.create( { 
  id       :"mytodolist123", 
  public   :true, 
  password : "secret"
}).push()

/* they */
hoodie.sharing.open( "mytodolist123", {password: "secret"} )
.done( function() {
  alert("welcome to my todolist!")
})

// ### Usecase 8: Sharing Subscriptions

// I can subscribe to a sharing by others. It can be used just like the `open`
// method, with the difference that an internal $sharingAccess object will be 
// added to my store. This allows me to get a list of all sharings I've access 
// to.
hoodie.sharing.subscription.create("sharing_id")

/* or */
hoodie.sharing.open( "sharing_id" ).done( function(sharing) {
  sharing.subscribe()
})

// I can pass options when creating a subscription, like password for protected
// sharings or continuous if I want to continuously synchronize with the 
// sharing 
hoodie.sharing.subscription.create("sharing_id", {
  continuous: true,
  password: "secret"
})


// ### Usecase 9: Subscribing to events in Sharings

// I can open a sharing and listen to changes of its containing objects
// 
app.sharing.open( "shared_id" ).done( function(sharing) {
  sharing.on('changed',        function(object) { /* ... */ })
  sharing.on('changed:type',   function(object) { /* ... */ })
  sharing.on('created',        function(object) { /* ... */ })
  sharing.on('created:type',   function(object) { /* ... */ })
  sharing.on('updated',        function(object) { /* ... */ })
  sharing.on('updated:type',   function(object) { /* ... */ })
  sharing.on('destroyed',      function(object) { /* ... */ })
  sharing.on('destroyed:type', function(object) { /* ... */ })
})