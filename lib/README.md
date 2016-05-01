# How things work

After [installing hoodie](../#setup), `npm start` will run [bin/start.js](../bin/start.js)
which reads out [configuration](../#usage) from all the different places using
the [rc](https://www.npmjs.com/package/rc) package, then passes it as options to
`getHoodieServer`, the main function return by this package, defined in
[lib/index.js](index.js).

In `getHoodieServer` the passed options are amended with defaults and parsed
into configuration for the hapi server and the core modules (see [architecture](#architecture)).
For example, [hoodie-account-server](https://github.com/hoodiehq/hoodie-account-server)
and [hoodie-store-server](https://github.com/hoodiehq/hoodie-store-server) require
different kind of options, which are extracted from options and stored in `config.account`
and `config.store` respectively.

The biggest difference is wether data is stored using an external CouchDB (`options.dbUrl` is set)
or using PouchDB (`options.dbUrl` is not set, this is the default behavior).
For example, the server secret is stored & retrieved in different ways based on
that, you can see [lib/config/db/couchdb.js](config/db/couchdb.js) and
[lib/config/db/pouchd.js](config/db/pouchd.js) to see how the differences are handled.

Once all configuration is taken care of, the internal plugins are initialised
(see [lib/plugins/index.js](plugins/index.js)). We define simple hapi plugins
for [logging](plugins/log.js) and for [serving the app’s public assets and the hoodie client](plugins/public.js).
We also load the core modules and register them with the hapi server.

Once everything is setup, `getHoodieServer` runs the callback and passes the
hapi `server` instance. The server is then started at the end of [bin/start.js](../bin/start.js)
and the URL where hoodie is running is logged to the terminal.

## Architecture

Hoodie is server built on top of [hapi](http://hapijs.com) with frontend APIs
for account and store related tasks.

It consists of three main components

1. [**account**](https://github.com/hoodiehq/hoodie-account)  
   Hoodie’s account core module. It exposes [JSON API](http://jsonapi.org/) routes,
   a corresponding server API at `server.plugins.account.api`,
   a client API and a generic account UI.

2. [**store**](https://github.com/hoodiehq/hoodie-store)  
   Hoodie’s store core module. It exposes [CouchDB’s Document API](https://wiki.apache.org/couchdb/HTTP_Document_API),
   a corresponding client and a generic store UI.

3. [**client**](https://github.com/hoodiehq/hoodie-client)  
   Hoodie’s front-end client for the browser. It integrates the following client modules:
   1. [account](https://github.com/hoodiehq/hoodie-account-client)
   2. [store](https://github.com/hoodiehq/hoodie-store-client)
   3. [log](https://github.com/hoodiehq/hoodie-log)
   4. [connection-status](https://github.com/hoodiehq/hoodie-connection-status)
