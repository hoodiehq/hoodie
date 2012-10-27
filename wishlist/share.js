// Share
// ==========

// To showcase the share module, its settings and API, we'll take an todo app
// as example. I can create multiple todo lists with it and can share these.


// Share options
// ---------------
// 
// * access     (default: false)
// * password   (default: _no password_)


// ### the `access` setting (default: false)
// 
// the access setting defines which user (group) has read or write access.
// When set to true, the sharing is public and everybody who knows the share
// id can access and edit it. To limit to read only, set access to read: true.
// You can also define specific user names to give them access. Write access
// does always include read access as well.

//
// *access: false* (default)
// Nobody but me can access the todolist, until I make
// the share public or invite readers / writers to it.
//
share = hoodie.share.create();

//
// access: true
// Everybody will be able to acces and edit the todo list
//
share = hoodie.share.create( {access: true} );

//
// access: [user1, user2]
// Besides me, only user1 and user2 will have access to the todolist
//
share = hoodie.share.create( {access: ['aj@foo.com', 'bj@foo.com']} );

//
// access: {read: true}
// Everybody will be able to acces the todo list, but only I can edit it
//
share = hoodie.share.create({access: {read: true}});
share.add(todolist);

//
// access: {read: true, write: [user1, user2]}
// Everybody will be able to acces the todo list,
// but only user1, user2 and me can edit it
//
share = hoodie.share.create({
  access: {
    write: ['aj@foo.com', 'bj@foo.com']
  }
});
share.add(todolist).push();

//
// access: {read: [user1, user2], write: [user3]}
// Besides me, only user1, user2 and user3 will have access to the
// todolist and only CJ and me can edit it
//
share = hoodie.share.create({
  access: {
    read:  ['aj@foo.com', 'bj@foo.com'],
    write: ['cj@foo.com']
  }
});
share.add(todolist).push();

// ### the `password` setting

//
// password not set (default)
// everybody can access the share with the share.id
//
hoodie.share.create({access: true});

//
// password set to "secret"
// Others will need both the share.id and
// the password in order to access the share
//
hoodie.share.create({access: true, password: "secret"});



// Share API
// -----------


// ### Share Module methods

// * direct call
//   opens a share, gives access to its api
hoodie.share("share_id");

// * open
//   same as direct call
hoodie.share.open("share_id");

// * create
//   create a new share
hoodie.share.create({});

// * find
//   find an existing sharings
hoodie.share.find(share_id);

// * findOrCreate
//   finds an existing sharing, otherwise creates it
hoodie.share.findOrCreate(share_attributes);

// * findAll
//   find all my sharings
hoodie.share.findAll();

// * save
//   overwrites or creates a new share
hoodie.share.save('share_id', {});

// * update
//   updates an existing share
hoodie.share.update('share_id', changed_attributes);

// * updateAll
//   update all my sharings
hoodie.share.updateAll({access: false});
hoodie.share.updateAll( function(share) {
  share.access = false;
});

// * destroy
//   deletes a share
hoodie.share.destroy('share_id');

// * destroyAll
//   delete all my shares
hoodie.share.destroyAll();



// ### Share Instance methods
// 
// A Share inherits from the RemoteStore Module and gets namespaced by
// its id. It adds additional methods to add and remove objects and alters
// methods save, update and delete so when these are called withoud type
// and id, they get applied on the share object directly.
//

// * save
//   save a share, overwrites all settings if share existed before
hoodie.share("share_id").save({});

// * update    
//   update an existing setting, only passed attributes get changed
hoodie.share("share_id").update({});

// * destroy    
//   deletes a share, unshares all its objects
hoodie.share("share_id").destroy();

// * add
//   add object(s) to the share
hoodie.share("share_id").add(object);
hoodie.share("share_id").add([object1, object2]);

// * remove  
//   remove object(s) from the share
hoodie.share("share_id").remove(object);
hoodie.share("share_id").remove([object1, object2]);



// ## Use cases
//
// 1.  Public Share
// 2.  Private Share
// 3.  Continuous Share
// 4.  Manual Share
// 5.  Read only Share
// 6.  Collaborative Shares
// 7.  Public, password protected shares
// 8.  Listen to events in Shares
//
// To be done:
//
// *   Loading other users' shares
// *   Subscribe to other users' shares
// *   Change settings (e.g. collaborators) after the share has been created
// *   Differentiate between anonymous users and users with accounts?
// *   user group access?


// ### Usecase 1: Public Share

// Let's say I've a todolist that I want to share 
// publicly with others with an secret URL. First we add the todolist
// (by passing an object with the respective type & id) and then
// the todolist will be available to others at the secret URL
//
hoodie.share.create({access: true})
.done( function(share) {
  
  share.add(todolist).push()
  .done( function() {
    share_url = "http://mytodoapp.com/shared/" + share.id;
    alert("Share your todolist at " + share_url);
  });
});


// ### Usecase 2: Private Share

// Let's say I've another todolist that I want to share only 
// with my collegues aj@example.com and bj@example.com. I want the todolist to
// to be accessible for AJ, BJ and myself only.
//
hoodie.share.create({access: ["aj@example.com", "bj@example.com"]})
.done( function(share) {
  share.add(todolist);

  share_url = "http://mytodoapp.com/shared/" + share.id;
  alert("AJ and BJ can access the todolist at " + share_url);
});


// ### Usecase 3: Continuous Share

// If you don't want to manually pull and push changes of shared objects, you
// can set the share to be continuous. 
hoodie.share.create( {continuous: true} )
.done( function(share){

  // * added todolists will be synched right away
  share.add(todolist);

  // * changes to added todolists will be synched right away
  hoodie.store.update(todolist, {name: "new name"});

  // * removed docs will be removed from the share right away
  share.remove(todolist);
});


// ### Usecase 4: Manual Share

// Manual share means you have to manually push and pull changes of shared
// objects, it's the default behavior. Each of the following methods returns
// a promise
//
hoodie.share("share_id").push();
hoodie.share("share_id").pull();
hoodie.share("share_id").sync();


// ### Usecase 5: Read only Share

// If you want to prevent other users to make changes to your shared objects,
// setz `access` to `{ read: true }`. If another user will try to push to
// `hoodie.share("share_id")`, it will be rejected.
// 
hoodie.share.create( {access: {read: true}} );
hoodie.share( "share_id" ).push();


// ### Usecase 6: Collaborative Shares

// If you want to invite others to collaborate on your objects, you need
// to set the collaborative setting to true. Then all users knowing the 
// share.id will be able to push changes.
//
hoodie.share.create( {access: true} )
.done( function(share){
  share.add([todolist, todo1, todo2, todo3]).push() ;
});


// ### Usecase 7: Public, password protected shares

// I can optionally assign a password to a share that needs to be provided by
// others when trying to accessing it:
hoodie.share.create( { 
  acess    : true, 
  password : "secret"
}).push();

// If other users want to access your share, they need to passt the password
// as option
hoodie.share( "mytodolist123", {password: "secret"} )
.findAll( function(objects) {
  alert("welcome to my todolist!");
});


// ### Usecase 8: Subscribing to events in Shares

// I can open a share and listen to changes of its containing objects
//
hoodie.share('shared_id').on('changed',        function(object) { /*...*/ });
hoodie.share('shared_id').on('changed:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('created',        function(object) { /*...*/ });
hoodie.share('shared_id').on('created:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('updated',        function(object) { /*...*/ });
hoodie.share('shared_id').on('updated:type',   function(object) { /*...*/ });
hoodie.share('shared_id').on('destroyed',      function(object) { /*...*/ });
hoodie.share('shared_id').on('destroyed:type', function(object) { /*...*/ });