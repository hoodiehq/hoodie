// Hoodie Email Extension
// ========================

// Sending emails. Not unicorns
// 

Hoodie.extend('email', function(hoodie) {

  // this is the function that gets
  // executed on `hoodie.email( options )`
  function sendEmail(options) {}
    var defer, handleSuccess;

    // if user has no account, sign up anonymously,
    // so that tasks get replicated to the Couch.
    if (!hoodie.account.hasAccount()) {
      hoodie.account.anonymousSignUp();
    }

    // we need a custom defer, as the returned promise shall not
    // be resolved before the actual email was sent. Technically,
    // the confirmation that an email was sent is when the email
    // task object has been removed remotely.
    // 
    defer = hoodie.defer();

    // add the $email task object to the store. If there is an error,
    // reject right away. If not, wait for updates coming from remote.
    hoodie.store.add('$email', options).then(handleEmailTaskCreated(defer), defer.reject);
    
    return defer.promise();
  };

  // this method gets executed, when the $email task was created
  // successfully in the local store. We then wait for updates
  // coming from remote
  // 
  handleEmailTaskCreated = function(defer) {
    return function(email) {
      hoodie.remote.on("change:$email:" + email.id, handleEmailTaskChange(defer) );
    };  
  };


  // we listen to two events on $email tasks
  // 
  // 1. email was sent
  // 2. there was an error
  // 
  // When an email was sent, the `sentAt` property gets set (and the object gets removed).
  // When an error occurs, the message gets set in the `$error` property.
  handleEmailTaskChange = function(defer) {
    return function(event, email) {

      if (email.sentAt) {
        defer.resolve(email);
      }

      if (email.$error)  {
        defer.reject(email);
      }
    };
  };
  
  return sendEmail
});
