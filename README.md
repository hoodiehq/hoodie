[![Build Status](https://travis-ci.org/hoodiehq/hoodie.js.png?branch=master)](https://travis-ci.org/hoodiehq/hoodie.js)

hoodie ✪ power to the frontend!
===============================

hoodie is a JavaScript library that runs in your browser.  
It gives you

* user authentication
* data storage and sync
* sharing
* emails
* and so much more

And this is what it looks like:

```javascript
// user authentication & more
hoodie.account.signUp('joe@example.com', 'secret')
hoodie.account.signIn('joe@example.com', 'secret')
hoodie.account.changePassword('secret', 'new_secret')
hoodie.account.changeUsername('secret', 'newusername')
hoodie.account.signOut()
hoodie.account.resetPassword('joe@example.com')

// store data (it will sync to whereever your users sign in)
hoodie.store.add('task', {title: 'build sweetMasterApp tomorrow.'})
hoodie.store.findAll('task')
hoodie.store.update('task', '123', {done: true})
hoodie.store.remove('task', '123')

hoodie.store.on('add:task', function(object) {
  alert('new Task added: ' + object.task)
})

// publish & share data
hoodie.store.findAll('task').publish()
hoodie.user( username ).findAll()

hoodie.store.find('task', '456').share()
hoodie.share(shareId).findAll()
hoodie.share(shareId).subscribe()

// sending emails … yep.
var magic = hoodie.email.send({
  to      : ['susan@example.com'],
  cc      : ['bill@example.com'],
  subject : 'rule the world',
  body    : 'we can do it!\nSigned, Joe'
})
magic.done( function(mail) { 
  alert('Mail has been sent to ' + mail.to)
})
magic.fail( function(eror) { 
  alert('Sory, but something went wrong: ' + error.reason)
})

// Like what you see? Good. Because we got more:
// http://hoodiehq.github.com/hoodie.js
// API DOCS: http://hoodiehq.github.com/hoodie.js/doc/hoodie.html
```


But … how does it work?
-----------------------

It's magic, stupid!™ 

Every app gets its own hoodie. You need to set one up, because that's `whereTheMagicHappens`:

```html
<script src="hoodie.js"></script>
<script>
  whereTheMagicHappens = 'https://yourapp.hood.ie';
  hoodie = new Hoodie(whereTheMagicHappens);
</script>
```

You can get a hoodie for your app with only a few clicks over on [hood.ie](http://hood.ie).

If you like to host the magic yourselves, [there you go](https://github.com/hoodiehq/hoodie-app).


Dependencies
------------

hoodie borrows some functionality from [jQuery](http://jquery.com), but we plan to remove this dependency soon.


Feedback
--------

If you have any kind of feedback, especially regarding hoodie's API, please [let us know](https://github.com/hoodiehq/hoodie.js/issues). You can also find us on Twitter: [@hoodiehq](https://twitter.com/hoodiehq)


Contribute
----------

Want to join the revolution? Here's a [quickstart for developers](https://github.com/hoodiehq/hoodie.js/blob/master/quickstart_for_developers.md)


License & Copyright
-------------------

© 2012 Gregor Martynus  
Licensed under the Apache License 2.0.
