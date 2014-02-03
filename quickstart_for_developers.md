Quickstart for developers
=========================

hoodie.js uses [grunt.js](http://gruntjs.com) for automation and [phantomJS](http://phantomjs.org/) headless testing.

```bash
  # install phantomJS for testing
  brew update && brew install phantomjs
```

That's all you need. Make your changes, run the test, send a pull request, win karma. We've lots to give

```bash
  grunt test        # Run all test
  grunt watch       # Build lib/ and watch for changes
  grunt build       # build dist/hoodie.js & dist/hoodie.min.js
```


Hoodie Folders & Files
----------------------

```
src
├── hoodie.js    Entry point. Builds the Hoodie instance
├── hoodie       hoodie core modules, exposed as hoodie.moduleName
├── lib          internally used modules, exposed in `Hoodie.extend( function(hoodie, lib) {})`
└── utils        internally used helper methods, exposed in `Hoodie.extend( function(hoodie, lib, utils) {})`
```


Conventions
-------------

* we use camelCase for `code` & `object` properties
* every object has a `type` and an `id` attribute, that gets combined for couchDB to `_id` in the form of {type}/{id}.
* we only allow characters in `type` & `id` that are also allowed for couchDB database names
* tasks are just objects, with `type` prefixed by `$`
* all events are lowercase letters only
* every user has a database, the name is user/{userHash}
* if plugins create own databases, we encourage them to follow the convention


hoodie backend (server)
-----------------------

If you want to run a hoodie server locally, you need [hoodie server](https://github.com/hoodiehq/hoodie-server).

The hoodie server is a couchDB instance with some workers listening to changes and doing things like
creating databases for users or sending emails. `hoodie.js` is talking directly with the couchDB api.

Here is a list of requests that hoodie.js is sending:

* POST, DELETE /_session
* GET, PUT, DELETE /_users/username
* GET /user_database/_changes
* POST /user_database/_bulk_docs
* GET, PUT, DELETE /user_database/id

not yet, but probably soon

* GET /user_database/_design/doc/_view/name
* PUT /user_database/_design/doc/_update/name/id

