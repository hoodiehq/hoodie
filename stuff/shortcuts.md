Shortcuts
===========

just some helpers.


Delete all user accounts
--------------------------

```js
$.couch.db('_users').allDocs( {success: function(response) {
  var user_docs = []
  $.each(response.rows, function() {
    if (/org.couchdb.user/.test(this.id)) user_docs.push({_id: this.id, _rev: this.value.rev})
  })
  $.couch.db('_users').bulkRemove({docs: user_docs})
}})
```