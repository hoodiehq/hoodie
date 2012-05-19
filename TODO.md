* add restriction: sign up only with valid email
* remove dependency on jQuery / zepto.js, then uncomment `use strict` statements

### Account

* what if @email is different from what GET /_session returns? Can there be a case like that?
* before sign in / sign out: sign out if `_couch.account.email` is a different email address