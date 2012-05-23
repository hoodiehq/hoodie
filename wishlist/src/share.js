// Sharing (Wishlist)
// --------------------
//
// Use cases:
// 
// 1. Public Sharing
// 
//    I've created stuff that I want to share with anybody
// 
// 2. Private Sharing
// 
//    I've created stuff that I want to share with specific other accounts.
// 
// Sharings are special type of couchDB docs, they look like this:
// 
// 
//     {
//       _id           : "sharing/abc4567",
//       type          : "$sharing",
//       private       : false,
//       continuous    : false,
//       collaborative : false,
//       filter        : {shared: true},
//       invitees      : ['joe@example.com', 'joey@eaxmle.com'],
// 
//       status        : "done",
//       done_at       : "2012-04-29T20:01:58.331Z",
//       created_at    : "2012-03-29T20:01:58.331Z",
//       updated_at    : "2012-03-29T20:01:58.331Z" 
//     }
// 

// ### Making a user_db publict

// The simplest case, when I in general want to share all data of my account, I'd suggest
// to introduce an `access` setting to the user account.
app.account.sign_up('anonymous_id345', null, {access: 'public_read'})
app.account.settings('access', 'public_read')

// When a user_db is set to `public_read`, anybody can read its data
app.sharing.open('anonymous_id345').loadAll().done( /* ... */ )


// Public Sharing
// ----------------

// ### Share all my data (manually)
// 
// I want to make all my current data and make it accessible by others, without exposing my user_db
app.sharing.create().done( function(sharing) {
  alert('your data has been shared.')
})

// ### Share again
// 
// after I made changes, I might want to share my data again. I don't want
// a new DB to be created, instead, I want my shared docs to be updated
app.sharing.load('uuid567').update()

// ### Share only objects of one specific type
app.sharing.create({
  filter : { type: 'type'}
}).done( /* ... */ )

// ### Share only on specific object
app.sharing.save({
  filter : { type: 'type', id: 'uuid567'}
}).done( /* ... */ )

// ### Share objects with a custom filter
// 
// custom filters are simple JavaScript functions. Any object gets passed as parameter,
// one by one. When the filter returns true, share the doc, otherwise not.
app.sharing.save({
  filter : function(obj) { return obj.is_public }
}).done( /* ... */ )

// ### Share continuously
// 
// instead of updating my shared data manually, I can set it to be continuously updated
app.sharing.save({
  continuously : true
})

// ### Receive shared docs
// 
// The API to load shared data should match the `app.store` API.
app.sharing.open( shared_id ).loadAll().done( function(objects)   { /* ... */ })

// ### change shared docs
// 
// The API to change shared data should match the `app.store` API as well.
// Whether I'm allowed to change the data or not is set on the shared_db security.
app.sharing.open( shared_id ).save(type, id, object).done( function(object, was_new) { /* ... */ })

// ### Subscribe to changes of shared docs
// 
// The API to sbscribe to changes should match the `app.remote` API.
app.sharing.open( shared_id ).on('changed',        function(type, id, object) { /* ... */ })
app.sharing.open( shared_id ).on('changed:type',   function(id, object) { /* ... */ })
app.sharing.open( shared_id ).on('created',        function(type, id, object) { /* ... */ })
app.sharing.open( shared_id ).on('created:type',   function(id, object) { /* ... */ })
app.sharing.open( shared_id ).on('updated',        function(type, id, object) { /* ... */ })
app.sharing.open( shared_id ).on('updated:type',   function(id, object) { /* ... */ })
app.sharing.open( shared_id ).on('destroyed',      function(type, id, object) { /* ... */ })
app.sharing.open( shared_id ).on('destroyed:type', function(id, object) { /* ... */ })


// Private Sharing
// ----------------
// 
// Private sharing means, I want to share all or some of my data with one or several
// other accounts and give them read access or both read & write access.
// 
// When I share data privately, a shared db gets created as well, but it is not
// accessible directly. Instead, its data gets replicated directly into other
// user dbs

app.sharing.save({
  target    : 'joe@example.com',
  private   : true
})