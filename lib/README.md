# Module Structure

This is the directory where all the `hoodie-server` code lies. It is divided into multiple sections:

| Section | Explanation |
| --- | --- |
| [`config-store`](config-store.js) | persist config in "data/config.json" |
| [`config`](config.js) | normalize and apply defaults to config |
| [`database`](database) | set up and start the database (CouchDB/PouchDB Server) |
| [`hapi`](hapi) | consists hoodie's base API and loads both internal and external hapi plugins |
| [`index`](index.js) | put it all together for `require('hooodie-server')` |
