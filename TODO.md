* bootstrapping: the initial load of data is a special case. Some docs might
  depend on others, so the initial load of data should give hoodie a special
  state or similar. Just a thought at the moment

* remove dependency on jQuery / zepto.js, then uncomment `use strict` statements
* do some kind of modularization: add a moduleLoader for the built in modules 
  like email, store and remote but also use it for custom modules.
  

### Sharing

# spec current code
# destroying sharings
# filters?
# build it into minutes.io

=> required couchDB setting
   httpd.authentication_handlers:
   put cookies to the end to allow authenticated requests as a different user
   than I'm currently signed in.


### Account

* spec `window.setTimeout @authenticate` in constructor
* what if @email is different from what GET /_session returns? Can there be a case like that?
* before sign in / sign out: sign out if `hoodie.config.get('account.email')` is a different email address


### Remote

* spec in _parse_from_pull

  # handle rev
  if obj.rev
    obj._rev = obj.rev
    delete obj.rev
    
### Store

* spec `update`: make sure that options get passed to save



### Dev shortcuts

# delete all user accounts
$.couch.db('_users').allDocs( {success: function(response) {
  var user_docs = []
  $.each(response.rows, function() {
    if (/org.couchdb.user/.test(this.id)) user_docs.push({_id: this.id, _rev: this.value.rev})
  })
  $.couch.db('_users').bulkRemove({docs: user_docs})
}})