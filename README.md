hoodie ✪ power to the frontend!
===============================

hoodie is a nice way to dress a backend, so you actually enjoy talking to it. Who cares, anyway? All we want is to allow users to sign up and to access their data from all their devices, right? Well, now you can. And we made it pretty for you:

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
  alert("new Task added: " + object.task)
})

// publish & share data
hoodie.store.findAll("task").publish()
hoodie.user( username ).store.findAll()

hoodie.store.find("task", "456").share()
hoodie.share( shareId ).store.findAll()
hoodie.share( shareId ).subscribe()

// sending emails … yep.
var magic = hoodie.email.send( {
  to      : ['susan@example.com'],
  cc      : ['bill@example.com'],
  subject : 'rule the world',
  body    : "we can do it!\nSigned, Joe"
} )
magic.done( function(mail) { 
  alert("Mail has been sent to " + mail.to)
})
magic.fail( function(eror) { 
  alert("Sory, but something went wrong: " + error.reason)
})

```

Like what you see? Good. Because we got more: http://hoodiehq.github.com/hoodie.js


But … how does it work?
-----------------------

It's magic, stupid!™ 

```html
<script src="hoodie.js"></script>
<script>
  whereTheMagicHappens = 'https://yourapp.hood.ie';
  hoodie = new Hoodie(whereTheMagicHappens);
</script>
```

Every app gets its own hoodie. You need to know the URL of yours, that's `whereTheMagicHappens`.
Get it on [hood.ie](http://hood.ie). Or you [do it yourself](https://github.com/hoodiehq/hoodie-app)


Dependencies
------------

hoodie currently depends on on [jQuery](http://jquery.com), but that's only temporary. 


Feedback
--------

If you have anykind of feedback, especially regarding hoodie's API, please [let us know](https://github.com/hoodiehq/hoodie.js/issues). You can also find us on Twitter: [@hoodiehq](https://twitter.com/hoodiehq)


Contribute
----------

Want to join the revolution? Here's a [quickstart for developers](https://github.com/hoodiehq/hoodie.js/blob/master/quickstart_for_developers.md)


License & Copyright
-------------------

(c) 2012 Gregor Martynus
Licensed under the Apache License 2.0.