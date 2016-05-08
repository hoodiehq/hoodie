[back to hoodie](../README.md)

# hoodie/server

After [installing hoodie](../#setup), `npm start` will run [bin/start.js](../bin/start.js)
which reads out [configuration](../#usage) from all the different places using
the [rc](https://www.npmjs.com/package/rc) package, then passes it as options to
`getHoodieServer`, the main function returned by this package, defined in
[server/index.js](index.js).

Hoodie is built on [Hapi](https://hapijs.com).

In `getHoodieServer` the passed options are amended with defaults and parsed
into configuration for the Hapi server and the core modules (see [architecture](#architecture)).
For example, [hoodie-account-server](https://github.com/hoodiehq/hoodie-account-server)
and [hoodie-store-server](https://github.com/hoodiehq/hoodie-store-server) require
different options, which are extracted from options and stored in `config.account`
and `config.store` respectively.

Hoodie uses [CouchDB](https://couchdb.apache.org/) for data persistence and
authentication. If `options.dbUrl` is not set, it falls back to [PouchDB](https://pouchdb.com/).

Once all configuration is taken care of, the internal plugins are initialised
(see [server/plugins/index.js](plugins/index.js)). We define simple Hapi plugins
for [logging](plugins/log.js) and for [serving the app’s public assets and the Hoodie client](plugins/public.js).
We also load the core modules and register them with the Hapi server.

Once everything is setup, `getHoodieServer` runs the callback and passes the
Hapi `server` instance. The server is then started at the end of [bin/start.js](../bin/start.js)
and the URL where hoodie is running is logged to the terminal.

## Architecture

Hoodie is server built on top of [hapi](http://hapijs.com) with frontend APIs
for account and store related tasks.

1. ## account [:octocat:](https://github.com/hoodiehq/hoodie-account#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-account.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account.svg)](https://david-dm.org/hoodiehq/hoodie-account)

   > Hoodie’s account core module. It combines [account-client](https://github.com/hoodiehq/hoodie-account-client),
     [account-server](https://github.com/hoodiehq/hoodie-account-server) and
     exposes a generic account UI.

   1. ### account-server [:octocat:](https://github.com/hoodiehq/hoodie-account-server#readme) [![Build Status](https://api.travis-ci.org/hoodiehq/hoodie-account-server.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account-server) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-account-server/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-account-server?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account-server.svg)](https://david-dm.org/hoodiehq/hoodie-account-server)

      > [Hapi](http://hapijs.com/) plugin that implements the
        [Account JSON API](http://docs.accountjsonapi.apiary.io) routes and
        exposes a corresponding API at `server.plugins.account.api.*`,
        persisting user accounts using [PouchDB](https://pouchdb.com).

   2. ### account-client [:octocat:](https://github.com/hoodiehq/hoodie-account-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-account-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-account-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-account-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account-client.svg)](https://david-dm.org/hoodiehq/hoodie-account-client)

      > [see below](#account-client)

1. ## store [:octocat:](https://github.com/hoodiehq/hoodie-store#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store.svg)](https://david-dm.org/hoodiehq/hoodie-store)

   > Hoodie’s store core module. It combines [store-client](https://github.com/hoodiehq/hoodie-store-client),
     [store-server](https://github.com/hoodiehq/hoodie-store-server) and exposes
      a generic store UI.


   1. ### store-server [:octocat:](https://github.com/hoodiehq/hoodie-store-server#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store-server.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store-server) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-store-server/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-store-server?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store-server.svg)](https://david-dm.org/hoodiehq/hoodie-store-server)

      > [Hapi](http://hapijs.com/) plugin that implements [CouchDB’s Document API](https://wiki.apache.org/couchdb/HTTP_Document_API).
        Compatible with [CouchDB](https://couchdb.apache.org/) and [PouchDB](https://pouchdb.com/)
        for persistence.

   2. ### store-client [:octocat:](https://github.com/hoodiehq/hoodie-store-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-store-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-store-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store-client.svg)](https://david-dm.org/hoodiehq/hoodie-store-client)

      > [see below](#store-client)

1. ## client [:octocat:](https://github.com/hoodiehq/hoodie-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-client.svg)](https://david-dm.org/hoodiehq/hoodie-client)

   > Hoodie’s front-end client for the browser. It integrates Hoodie’s client
     core modules: [account-client](https://github.com/hoodiehq/hoodie-account-client), [store-client](https://github.com/hoodiehq/hoodie-store),
     [connection-status](https://github.com/hoodiehq/hoodie-connection-status)
     and [log](https://github.com/hoodiehq/hoodie-log)

   1. ### <a name="account-client"></a>account-client [:octocat:](https://github.com/hoodiehq/hoodie-account-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-account-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-account-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-account-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account-client.svg)](https://david-dm.org/hoodiehq/hoodie-account-client)

      > Client for the [Account JSON API](http://docs.accountjsonapi.apiary.io).
        It persists session information in localStorage and provides
        front-end friendly APIs for things like creating a user account,
        confirming, resetting a password, changing profile information,
        or closing the account.

   2. ### <a name="store-client"></a>store-client [:octocat:](https://github.com/hoodiehq/hoodie-store-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-store-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-store-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store-client.svg)](https://david-dm.org/hoodiehq/hoodie-store-client)

      > Store client for data persistence and offline sync. It combines [pouchdb-hoodie-api](https://github.com/hoodiehq/pouchdb-hoodie-api) and [pouchdb-hoodie-sync](https://github.com/hoodiehq/pouchdb-hoodie-sync).
      It adds a few other methods like `.isPersistent()` or `.hasLocalChanges()`
      and a scoped store API.

      1. #### pouchdb-hoodie-api [:octocat:](https://github.com/hoodiehq/pouchdb-hoodie-api#readme) [![Build Status](https://travis-ci.org/hoodiehq/pouchdb-hoodie-api.svg?branch=master)](https://travis-ci.org/hoodiehq/pouchdb-hoodie-api) [![Coverage Status](https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-api/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/pouchdb-hoodie-api?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/pouchdb-hoodie-api.svg)](https://david-dm.org/hoodiehq/pouchdb-hoodie-api)

         > [PouchDB](https://pouchdb.com) plugin that provides simple methods to
           add, find, update and remove data.

      2. #### pouchdb-hoodie-sync [:octocat:](https://github.com/hoodiehq/pouchdb-hoodie-sync#readme) [![Build Status](https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync.svg?branch=master)](https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync) [![Coverage Status](https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-sync/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/pouchdb-hoodie-sync?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/pouchdb-hoodie-sync.svg)](https://david-dm.org/hoodiehq/pouchdb-hoodie-sync)

         > [PouchDB](https://pouchdb.com) plugin that provides simple methods to
           keep two databases in sync.

   3. ### connection-status [:octocat:](https://github.com/hoodiehq/hoodie-connection-status#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-connection-status.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-connection-status) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-connection-status/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-connection-status?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-connection-status.svg)](https://david-dm.org/hoodiehq/hoodie-connection-status)

      > Browser library to monitor a connection status. It emits `disconnect` &
        `reconnect` events if the request status changes and persists its status
        in `localStorage`.

   4. ### log [:octocat:](https://github.com/hoodiehq/hoodie-log#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-log.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-log) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-log/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-log?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-log.svg)](https://david-dm.org/hoodiehq/hoodie-log)

      > JavaScript library for logging to the browser console. If available, it
        takes advantage of [CSS-based styling of console log outputs](https://developer.mozilla.org/en-US/docs/Web/API/Console#Styling_console_output).
