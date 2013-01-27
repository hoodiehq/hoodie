Shortcuts
===========

just some helpers.


Delete all user accounts
--------------------------

```js
$.couch.db('_users').allDocs( {include_docs: true, success: function(response) {
  var docs = []
  $.each(response.rows, function() {
    if (/org.couchdb.user/.test(this.id)) docs.push(this.doc)
  })
  $.couch.db('_users').bulkRemove({docs: docs})
}})
```

Delete all replications
--------------------------

```js
$.couch.db('_replicator').allDocs( {success: function(response) {
  var docs = []
  $.each(response.rows, function() {
    if (/^[^_]/.test(this.id)) docs.push({_id: this.id, _rev: this.value.rev})
  })
  $.couch.db('_replicator').bulkRemove({docs: docs})
  console.log(docs)
}})
```

Delete all databases
----------------------

```js
$.couch.allDbs( {success: function(dbs) {
  while( db = dbs.shift() ) {
    if ( /^_/.test(db) ) continue;
    $.couch.db(db).drop()
  }
}} )
```