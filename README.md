

# Hoodie ✪ power to the frontend! [![Build Status](https://travis-ci.org/hoodiehq/hoodie.js.png?branch=master)](https://travis-ci.org/hoodiehq/hoodie.js)

Hoodie is a JavaScript library for the browser.

It offers you the following pieces of functionality right out of the box:

* user accounts and authentication
* data storage and sync
* sharing
* emails
* and so much more

And here is what it looks like:

### user accounts & authentication

```javascript
  // user signup
  hoodie.account.signUp('joe@example.com', 'secret');

  // user signIn
  hoodie.account.signIn('joe@example.com', 'secret');

  // user password change
  hoodie.account.changePassword('secret', 'new_secret');

  // user name change
  hoodie.account.changeUsername('secret', 'newusername');

  // user signout
  hoodie.account.signOut();

  // user password reset
  hoodie.account.resetPassword('joe@example.com');
```

### store data (it will sync to whereever your users sign in)

```javascript

  // add a new document of type 'task'
  hoodie.store.add('task', {
    title: 'build sweetMasterApp tomorrow.'
  });

  // find all 'task' documents
  hoodie.store.findAll('task');

  // update a 'task' document
  hoodie.store.update('task', '123', {
    done: true
  });

  // remove a 'task' document
  hoodie.store.remove('task', '123');

  // listen to and act upon document events
  hoodie.store.on('add:task', function(object) {
    alert('new Task added: ' + object.task)
  });
```

### publish & share data
```javascript

  // find all 'task' documents and publish them
  hoodie.store.findAll('task').publish();

  // find all documents that belong to a given user
  hoodie.user( username ).findAll();

  // find a given task and share it
  hoodie.store.find('task', '456').share();

  // find a all documents on a given share
  hoodie.share(shareId).findAll();

  // subscribe to a given share
  hoodie.share(shareId).subscribe();
```

### sending emails … yep.
```javascript

  // define an email object
  var magic = hoodie.email.send({
    to      : ['susan@example.com'],
    cc      : ['bill@example.com'],
    subject : 'rule the world',
    body    : 'we can do it!\nSigned, Joe'
  });

  magic.done(function(mail) {
    alert('Mail has been sent to ' + mail.to);
  });

  magic.fail(function(eror) {
    alert('Sory, but something went wrong: ' + error.reason);
  });


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

For more in-depth documentation, head over to [hood.ie](http://hood.ie).

## Contact

Have a question?

* [\#hoodie](http://webchat.freenode.net/?channels=hoodie) on Freenode
* [@hoodiehq](https://twitter.com/hoodiehq) on Twitter

## Contributing to this project

Anyone and everyone is welcome to contribute. Please take a moment to
review the [guidelines for contributing](CONTRIBUTING.md).

* [Bug reports](CONTRIBUTING.md#bugs)
* [Feature requests](CONTRIBUTING.md#features)
* [Pull requests](CONTRIBUTING.md#pull-requests)

License & Copyright
-------------------

Copyright 2012, 2013 https://github.com/hoodiehq/ and other contributors

Licensed under the Apache License 2.0.
