# TODO

* remove dependency on jQuery / zepto.js, then uncomment `use strict` statements

### Share

# spec current code
# destroying shares
# filters?

=> required CouchDB setting
   httpd.authentication_handlers:
   put cookies to the end to allow authenticated requests as a different user
   than I'm currently signed in.


### Account

* `authenticate` should not return false if `username` is not set. There are 
  circumstances when the username is not set, but the CouchDB session is still
  valid.
* make sure that same requests do not get sent multiple times, e.g. 
  GET /_session should be only sent once. Instead of sending another request,
  the promise of the pending one should be returned. If that doesn't make sense,
  e.g. password reset, than we have to make sure that a running request gets 
  aborted.
* spec `window.setTimeout @authenticate` in constructor
* what if @username is different from what GET /_session returns? Can there be a case like that?
* before sign in / sign up: sign out if `hoodie.my.config.get('account.username')` is a different email address


### Remote

* spec in _parse_from_pull

  # handle rev
  if obj.rev
    obj._rev = obj.rev
    delete obj.rev
    
### Store

* spec `update`: make sure that options get passed to save
* spec `destroyAll`


### Dev shortcuts

# delete all user accounts
$.couch.db('_users').allDocs( {success: function(response) {
  var user_docs = []
  $.each(response.rows, function() {
    if (/org.couchdb.user/.test(this.id)) user_docs.push({_id: this.id, _rev: this.value.rev})
  })
  $.couch.db('_users').bulkRemove({docs: user_docs})
}})