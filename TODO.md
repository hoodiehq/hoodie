* add restriction: sign up only with valid email
* remove dependency on jQuery / zepto.js, then uncomment `use strict` statements
* do some kind of modularization: add a moduleLoader for the built in modules 
  like email, store and remote but also use it for custom modules.

### Account

* what if @email is different from what GET /_session returns? Can there be a case like that?
* before sign in / sign out: sign out if `_couch.account.email` is a different email address