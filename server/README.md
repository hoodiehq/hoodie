[back to hoodie](../README.md)

# hoodie/server

After [installing hoodie](../#setup), `npm start` will run [cli/index.js](../cli/start.js)
which reads out [configuration](../#usage) from all the different places using
the [rc](https://www.npmjs.com/package/rc) package, then passes it as options to
[server/index.js](../server/index.js), the Hoodie core [hapi plugin](http://hapijs.com).

In [server/index.js](../server/index.js) the passed options are amended with defaults and parsed
into configuration for the Hapi server. It passes the configuration on to [hoodie-server]('#hoodie-server'),
which combines the core server modules. It also bundles the Hoodie client on first request to `/hoodie/client.js`
and passes in the configuration for the client. It also makes the app’s `public` folder accessible at
the `/` root path, and Hoodie’s Core UIs at `/hoodie/admin`, `/hoodie/account` and `/hoodie/store`.

Hoodie uses [CouchDB](https://couchdb.apache.org/) for data persistence and
authentication. If `options.dbUrl` is not set, it falls back to [PouchDB](https://pouchdb.com/).

Once all configuration is taken care of, the internal plugins are initialised
(see [server/plugins/index.js](plugins/index.js)). We define simple Hapi plugins
for [logging](plugins/log.js) and for [serving the app’s public assets and the Hoodie client](plugins/public.js).

Once everything is setup, the server is then started at the end of [cli/start.js](../cli/start.js)
and the URL where hoodie is running is logged to the terminal.

## Architecture

Hoodie is a server built on top of [hapi](http://hapijs.com) with frontend APIs
for account and store related tasks.

1. ## server [:octocat:](https://github.com/hoodiehq/hoodie-server#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-server.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-server) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-server/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-server?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-server.svg)](https://david-dm.org/hoodiehq/hoodie-server)

   > Hoodie’s core server logic as hapi plugin. It integrates Hoodie’s server
     core modules: [account-server](https://github.com/hoodiehq/hoodie-account-server), [store-server](https://github.com/hoodiehq/hoodie-store-server)

   1. ### account-server [:octocat:](https://github.com/hoodiehq/hoodie-account-server#readme) [![Build Status](https://api.travis-ci.org/hoodiehq/hoodie-account-server.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account-server) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-account-server/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-account-server?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account-server.svg)](https://david-dm.org/hoodiehq/hoodie-account-server)

      > [Hapi](http://hapijs.com/) plugin that implements the
        [Account JSON API](http://docs.accountjsonapi.apiary.io) routes and
        exposes a corresponding API at `server.plugins.account.api.*`.

        1. #### account-server-api [:octocat:](https://github.com/hoodiehq/hoodie-account-server-api#readme) [![Build Status](https://api.travis-ci.org/hoodiehq/hoodie-account-server-api.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account-server-api) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-account-server-api/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-account-server-api?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account-server-api.svg)](https://david-dm.org/hoodiehq/hoodie-account-server-api)

        > JavaScript API for accounts and sessions backed by [PouchDB](https://pouchdb.com)

   2. ### store-server [:octocat:](https://github.com/hoodiehq/hoodie-store-server#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store-server.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store-server) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-store-server/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-store-server?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store-server.svg)](https://david-dm.org/hoodiehq/hoodie-store-server)

      > [Hapi](http://hapijs.com/) plugin that implements [CouchDB’s Document API](https://wiki.apache.org/couchdb/HTTP_Document_API).
        Compatible with [CouchDB](https://couchdb.apache.org/)
        and [PouchDB](https://pouchdb.com/) for persistence.

2. ## client [:octocat:](https://github.com/hoodiehq/hoodie-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-client.svg)](https://david-dm.org/hoodiehq/hoodie-client)

   > Hoodie’s front-end client for the browser. It integrates Hoodie’s client
     core modules: [account-client](https://github.com/hoodiehq/hoodie-account-client), [store-client](https://github.com/hoodiehq/hoodie-store-client),
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

3. ## account [:octocat:](https://github.com/hoodiehq/hoodie-account#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-account.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-account) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-account.svg)](https://david-dm.org/hoodiehq/hoodie-account)

   > Hoodie’s account core module. It combines [account-client](account-client),
     [account-server](#account-server) and exposes a generic account UI.

4. ## store [:octocat:](https://github.com/hoodiehq/hoodie-store#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-store.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-store) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-store.svg)](https://david-dm.org/hoodiehq/hoodie-store)

   > Hoodie’s store core module. It combines [store-client](#store-client),
     [store-server](#store-server) and exposes a generic store UI.

5. ## admin [:octocat:](https://github.com/hoodiehq/hoodie-admin#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-admin.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-admin) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-admin.svg)](https://david-dm.org/hoodiehq/hoodie-admin)

   > Hoodie’s built-in Admin Dashboard, built with [Ember.js](http://emberjs.com)

   1. ### <a name="admin-client"></a>admin-client [:octocat:](https://github.com/hoodiehq/hoodie-admin-client#readme) [![Build Status](https://travis-ci.org/hoodiehq/hoodie-admin-client.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie-admin-client) [![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-admin-client/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie-admin-client?branch=master) [![Dependency Status](https://david-dm.org/hoodiehq/hoodie-admin-client.svg)](https://david-dm.org/hoodiehq/hoodie-account-client)

      > Hoodie’s front-end admin client for the browser. Used in the Admin Dashboard,
        but can also be used standalone for custom admin dashboard.
