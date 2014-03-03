# Hoodie ✪ power to the frontend! [![Build Status](https://travis-ci.org/hoodiehq/hoodie.js.png?branch=master)](https://travis-ci.org/hoodiehq/hoodie.js)

Hoodie is a JavaScript library for the browser.

It offers you the following pieces of functionality right out of the box:

* user accounts and authentication
* data storage and sync
* background tasks
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

### Tasks

Tasks get picked up by backend workers in the background. You can think
of them as special objects that describe specific tasks, for which you
want backend logic.

If a task has been completed successfully, it gets removed. If there
is an error, it stays in the task store to be handled or removed.


```js
  // start a new task. Once it was finished, the succes callback gets
  // called. If something went wrong, error callback gets called instead
  hoodie.task.start('message', {to: 'joe', text: 'Do you want to party?'})
    .then( showMessageSent, showMessageError )

  // abort a pending task
  hoodie.task.abort('message', '123')

  // restart a pending or aborted task
  hoodie.task.restart('message', '123', { extraProperty: 'value' })

  // aborted all pending tasks
  hoodie.task.restartAll()

  // restart all pending or aborted tasks
  hoodie.task.restartAll()
```

You can also subscribe to the following task events

* start
* abort
* error
* success

```javascript
  // listen to new tasks
  hoodie.task.on('start', function (newTask) {});

  // task aborted
  hoodie.task.on('abort', function (abortedTask) {});

  // task could not be completed
  hoodie.task.on('error', function (errorMessage, task) {});

  // task completed successfully
  hoodie.task.on('success', function (completedTask) {});

  // all listeners can be filtered by type
  hoodie.task.on('message:start',   function (newMessageTask, options) {});
  hoodie.task.on('message:abort',  function (abortedMessageTask, options) {});
  hoodie.task.on('message:error',   function (errorMessage, messageTask, options) {});
  hoodie.task.on('message:success', function (completedMessageTask, options) {});
  hoodie.task.on('message:change',  function (eventName, messageTask, options) {});

  // ... and by type and id
  hoodie.task.on('message:start:123',   function (newMessageTask, options) {});
  hoodie.task.on('message:abort:123',  function (abortedMessageTask, options) {});
  hoodie.task.on('message:error:123',   function (errorMessage, messageTask, options) {});
  hoodie.task.on('message:success:123', function (completedMessageTask, options) {});
  hoodie.task.on('message:change:123',  function (eventName, messageTask, options) {});
```

**note**: if `change` event is `"error"`, the error message gets passed as options.error


### publish & share data (work in progress)

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

### sending emails (work in progress)

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
    alert('Sorry, but something went wrong: ' + error.reason);
  });


```

But … how does it work?
-----------------------

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

Copyright 2012-2014 https://github.com/hoodiehq/ and other contributors

Licensed under the Apache License 2.0.
