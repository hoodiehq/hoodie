# `./lib`

This is the main `hoodie-server` code directory.

We differentiate a few different sections:

- `./core`: sets up the configuration environment, starts plugins and registers hooks.
- `./couchdb`: helps with starting and setting up a CouchDB instance `hoodie-server` can use.
- `./helper`: small pieces of code that don’t fit anywhere else.
- `./server`: the main HTTP API server setup, including definition of routes.
- `./utils`: other small pieces of code that are used all over the place.
