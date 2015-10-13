# Module Structure

This is the directory where all the `hoodie-server` code lies. It is divided into multiple sections:

| Section | Explanation |
| --- | --- |
| [`bundle`](bundle.js) | bundle the frontend code |
| [`config-store`](config-store.js) | persist config in "data/config.json" |
| [`config`](config.js) | normalize and apply defaults to config |
| [`database`](database) | set up and start the database (CouchDB/PouchDB Server) |
| [`hapi`](hapi) | internal hapi plugins including the hoodie API |
| [`hooks`](hooks.js) | load and run hooks |
| [`index`](index.js) | put it all together for `require('hooodie-server')` |
| [`plugins`](plugins) | provide an API for, load and start plugins |
