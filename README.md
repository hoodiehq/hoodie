API
===


Setup
-----

```javascript
couchDB_endpoint = 'http://worlddominatorapp.iriscouch.com';
hoodie = new Hoodie(couchDB_endpoint);
```


Accounts / Sessions
-------------------


### Sign Up

```javascript
app.account.sign_up('joe@example.com', 'secret')

  .done( function(user) {
    user.email // 'joe@example.com'
    user.uuid  // auto generated
    
    // data sync kicks in
  } ) 
  
  // signup error
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Sign In

```javascript
app.account.sign_in('joe@example.com', 'secret')

  .done( function(user) {
    // data sync kicks in
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Change password

```javascript
app.account.change_password('current_secret', 'new_secret')

  .done( function(user) { } ) 
  .fail( function(err)  { } )
```


### Authenticate

If you want to make sure that a user is authenticated with a valid
session, you can use the `authenticate` method.

```javascript
app.account.authenticate()

  .done( function(user) {
    // you are authenticated, your session is valid
  } ) 
  .fail( function(err) {
    // sorry, but your not authenticated, probably your session expired
  } ) 
```


### Sign Out

```javascript
app.account.sign_out()

  .done( function() {
    // session ends, local data gets cleaned up
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Forgot Password

```javascript
app.account.forgot_password('joe@example.com')

  .done( function() {
    alert( "Link has been sent to joe@example.com")
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } )
```


Data Storage / Sync
-------------------

### uuid

helper to generate unique IDs that you can use to store your objects.

```javascript
uuid = app.store.uuid(length)
```


### Create / Update

create or update an object.

```javascript
// create a new object
type = 'rule'
app.store.create( type, {name: "rule the world"} )
  
  .done ( function(new_object) { } )
  .fail ( function(err)        { } )
  
// save an object
id   = 'abc4567'
type = 'rule'
app.store.save( type, id, {name: "rule the world"} )
  
  .done ( function(object) { } )
  .fail ( function(err)        { } )
  
// update an existing object
id   = 'abc4567'
type = 'rule'
app.store.update( type, id, {nr: 1} )
  
  .done ( function(updated_object) { } )
  .fail ( function(err)        { } )
```


### Load

load an existing object

```javascript
app.store.load( type, id )

  .done ( function(object) { } )
  .fail ( function(err)    { } )
```


### Load all

load all objects available or from a specific type

```javascript
app.store.loadAll( type )

  .done ( function(objects) { } )
  .fail ( function(err)     { } )
```


### Delete

delete an existing object

```javascript
app.store.delete( type, id )

  .done ( function(deleted_object) { } )
  .fail ( function(err)            { } )
```


### Remote Updates

subscribe to changes from remote

```javascript
// new doc created
app.remote.on( 'created', function( type, id, created_object) { } )

// existing doc updated
app.remote.on( 'updated', function( type, id, updated_object) { } )

// doc deleted
app.remote.on( 'deleted', function( type, id, deleted_object) { } )

// any of above events
app.remote.on( 'changed', function( type, id, changed_object) { } )

// all listeners can be filtered by type
app.remote.on( "created:couch", function( id, created_object) { } )
app.remote.on( "updated:couch", function( id, updated_object)  { } )
app.remote.on( "deleted:couch", function( id, deleted_object) { } )
app.remote.on( "changed:couch", function( id, changed_object) { } )
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

* sharing
* searching
* payments
* file conversion
* ... ?


Dependencies
------------

Hoodie depends on and [require.js](http://requirejs.org).
It currently also depends on jQuery/[zepto](http://zeptojs.com/), but we will remove the dependance soon.


Contribute
==========

When you feel like contributing, I highly recommend to install [PhantomJS](http://www.phantomjs.org/) for automated, headless testing. Run `$ cake autotest` to have test running in the background while hacking.

When you're done with changes, make sure to run `$ r.js -o name=hoodie baseUrl=./compiled out=hoodie.min.js` to update the concatenated & minified js file for production use.


License & Copyright
===================

(c) 2012 Gregor Martynus <g@minutes.io>
Licensed under the Apache License 2.0.