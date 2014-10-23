Hoodie Browser Core CheatSheet
==============================

## Initialize Hoodie

```js
var hoodie = new Hoodie()
```

If the Hoodie server is running on a different domain:

```js
var hoodie = new Hoodie('https://example.com')
```

## hoodie.store

All methods return a promise.

```js
hoodie.store.add(type, properties)
hoodie.store.find(type, id)
hoodie.store.findAll(type)
hoodie.store.update(type, id, changedProperties)
hoodie.store.updateAll(type, changedProperties)
hoodie.store.remove(type, id)
hoodie.store.removeAll(type, id)
hoodie.store.findOrAdd(type, id, properties)
hoodie.store.addOrUpdate(type, id, properties)
```

## hoodie.account

```js
// find out if user is signed in
if (hoodie.account.username) { /* ... */ }
```

All methods return a promise.

```js
hoodie.account.signUp(username, password)
hoodie.account.signIn(username, password)
hoodie.account.signOut()
hoodie.account.destroy()
hoodie.account.resetPassword(username)
```

## Others

```js
// returns a unique id for the current user,
// independent of whether user has account or not
hoodie.id()

// send custom requests, type being 'GET', 'POST', etc
hoodie.request(type, path, options)

// work with remote store
var remoteStore = hoodie.open(dbName)
// remoteStore has same API as hoodie.store
```


## Events 

```
hoodie.on('disconnected', function() {})
hoodie.on('reconnected', function() {})

hoodie.store.on('change', function(eventName, object) {})
hoodie.store.on('add', function(object) {})
hoodie.store.on('update', function(object) {})
hoodie.store.on('remove', function(object) {})
// store change/add/update/remove events can be namespaced
hoodie.store.on('type:change', function(eventName, object) {})
hoodie.store.on('type:id:change', function(eventName, object) {})
hoodie.store.on('clear', function(){})

hoodie.account.on('signup', function(username){})
hoodie.account.on('signin', function(username){})
hoodie.account.on('signout', function(username){})
```
