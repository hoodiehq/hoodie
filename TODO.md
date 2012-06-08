* remove dependency on jQuery / zepto.js, then uncomment `use strict` statements
* do some kind of modularization: add a moduleLoader for the built in modules 
  like email, store and remote but also use it for custom modules.
  

### Sharing

# spec current code
# destroying sharings
# filters?
# build it into minutes.io


### Account

* what if @email is different from what GET /_session returns? Can there be a case like that?
* before sign in / sign out: sign out if `hoodie.config.get('_account.email')` is a different email address