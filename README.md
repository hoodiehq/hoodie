API
===


Setup
-----

```javascript
CouchDBEndpoint = 'http://worlddominatorapp.iriscouch.com';
hoodie = new Hoodie(CouchDBEndpoint);
```


Accounts / Sessions
-------------------


### Sign Up

```javascript
hoodie.account.signUp('joe@example.com', 'secret')

  .done( function() {  
    // data sync kicks in
  } ) 
  
  // signup error
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Sign In

```javascript
hoodie.account.signIn('joe@example.com', 'secret')

  .done( function() {
    // data sync kicks in
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Change password

```javascript
hoodie.account.changePassword('current_secret', 'new_secret')

  .done( function() { } ) 
  .fail( function(err)  { } )
```


### Authenticate

If you want to make sure that a user is authenticated with a valid
session, you can use the `authenticate` method.

```javascript
hoodie.account.authenticate()

  .done( function() {
    // you are authenticated, your session is valid
  } ) 
  .fail( function(err) {
    // sorry, but your not authenticated, probably your session expired
  } ) 
```


### Sign Out

```javascript
hoodie.account.signOut()

  .done( function() {
    // session ends, local data gets cleaned up
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Change Password

```javascript
hoodie.account.changePassword('currentpassword', 'newpassword')

  .done( function() {
    alert( "Password updated")
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } )
```


### reset Password

```javascript
hoodie.account.resetPassword('joe@example.com')

  .done( function() {
    alert( "Link has been sent to joe@example.com")
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } )
```


### Change Username

```javascript
hoodie.account.changeUsername('currentpassword', 'newusername')

  .done( function() {
    alert( "Username updated")
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } )
```


Data Storage / Sync
-------------------


### Create / Update

create or update an object.

```javascript
// create a new object
type = 'rule'
hoodie.store.create( type, {name: "rule the world"} )
  
  .done ( function(newObject)  { } )
  .fail ( function(err)        { } )

  
// save an object
id   = 'abc4567'
type = 'rule'
hoodie.store.save( type, id, {name: "rule the world"} )
  
  .done ( function(object) { } )
  .fail ( function(err)    { } )
  
  
// update an existing object
// Note: this changes only the passed attributes of the object
id   = 'abc4567'
type = 'rule'
hoodie.store.update( type, id, {nr: 1} )
  
  .done ( function(updatedObject) { } )
  .fail ( function(err)        { } )
```


### Load

find an existing object

```javascript
hoodie.store.find( type, id )

  .done ( function(object) { } )
  .fail ( function(err)    { } )
```


### Load all

find all objects available or from a specific type

```javascript
hoodie.store.findAll( type )

  .done ( function(objects) { } )
  .fail ( function(err)     { } )
```


### Destroy

destroy an existing object

```javascript
hoodie.store.destroy( type, id )

  .done ( function(destroyedObject) { } )
  .fail ( function(err)            { } )
```


### Remote

Remote module does synchronize a users data continuously by default, as soon as he signes up. To enable / disable continuous synchronization, use the following methods:

```javascript
hoodie.remote.startSyncing()
hoodie.remote.stopSyncing()
```

When you want to manually trigger syncing, use:

```javascript
hoodie.remote.push()
hoodie.remote.pull()
hoodie.remote.sync()
```

Subscribe to changes from remote

```javascript
// new doc created
hoodie.remote.on( 'created', function( createdObject) { } )

// existing doc updated
hoodie.remote.on( 'updated', function( updatedObject) { } )

// doc destroyed
hoodie.remote.on( 'destroyed', function( destroyedObject) { } )

// any of above events
hoodie.remote.on( 'changed', function( changedObject) { } )

// all listeners can be filtered by type
hoodie.remote.on( "created:couch", function( createdObject) { } )
hoodie.remote.on( "updated:couch", function( updatedObject) { } )
hoodie.remote.on( "destroyed:couch", function( destroyedObject) { } )
hoodie.remote.on( "changed:couch", function( changedObject) { } )

// and even by id
hoodie.remote.on( "created:couch:abc4567", function( createdObject) { } )
hoodie.remote.on( "updated:couch:abc4567", function( updatedObject) { } )
hoodie.remote.on( "destroyed:couch:abc4567", function( destroyedObject) { } )
hoodie.remote.on( "changed:couch:abc4567", function( changedObject) { } )
```


### Public User Stores

Users can publish their data, controlling exactly what will be made public.

```javascript
// make couch with id "abc4567" public
hoodie.store.update("couch","abc4567").publish()

// make couch with id "abc4567" public, but do only show the color, hide
// all other attributes
hoodie.store.update("couch","abc4567").publish(['color'])

// make couch with id "abc4567" private again
hoodie.store.update("couch","abc4567").unpublish()

// find all couches from user "joe"
hoodie.user("joe").findAll("couch").done( function(couches) { ... })
```


### Global Store

When enabled, all publicly shared objects by all users will be 
available through the hoodie.global API

```javascript
// find all public songs from all users
hoodie.global.findAll("song").done( function(songs) { ... })
```


### Public Shares

Users can share their data with others, controlling exactly what will
be shared.

```javascript
// see http://hoodiehq.github.com/hoodie.js/
```



Send E-Mails
------------

hell, yeah!

```javascript
email = {
  to      : ['susan@example.com'],
  cc      : ['bill@example.com'],
  subject : 'rule the world',
  body    : "we can do it!\nSigned, Joe"
}

app.email.send( email )

  // synched to server
  .progress ( function(email) { } )

  // email sent successfully
  .done     ( function(email) { } )

  // something went wrong
  .fail     ( function(err)   { } )
```


Future Ideas
------------

* shares & collaborations
* searching
* payments
* file conversion
* ... ?


Dependencies
------------

Hoodie depends on on jQuery/[zepto](http://zeptojs.com/), but we will remove the dependance at some point.


Contribute
==========

When you feel like contributing, I highly recommend to install [PhantomJS](http://www.phantomjs.org/) for automated, headless testing. Run `$ cake autotest` to have test running in the background while hacking.

When you're done with changes, make sure to run `$ cake build` to update the concatenated for testing.


License & Copyright
===================

(c) 2012 Gregor Martynus <g@minutes.io>
Licensed under the Apache License 2.0.