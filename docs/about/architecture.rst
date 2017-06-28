Architecture
============

After `installing hoodie <../guides/quickstart.html>`__, ``npm start`` will run
`cli/index.js <https://github.com/hoodiehq/hoodie/blob/master/cli/index.js>`__
which reads out the `configuration <../guides/configuration.html>`__
from all the different places using the `rc <https://www.npmjs.com/package/rc>`__
package, then passes it as options to ``server/index.js``, the Hoodie core
`hapi plugin <http://hapijs.com>`__.

In `server/index.js <https://github.com/hoodiehq/hoodie/blob/master/server/index.js>`__,
the passed options are merged with defaults and parsed into configuration for
the Hapi server. It passes the configuration on to `hoodie-server <https://github.com/hoodiehq/hoodie-server#readme>`__,
which combines the core server modules. It also bundles the Hoodie
client on first request to ``/hoodie/client.js`` and passes in the
configuration for the client. It also makes the app’s ``public`` folder
accessible at the ``/`` root path, and Hoodie’s Core UIs at
``/hoodie/admin``, ``/hoodie/account`` and ``/hoodie/store``.

Hoodie uses `CouchDB <https://couchdb.apache.org/>`__ for data
persistence. If ``options.dbUrl`` is not set, it falls back to `PouchDB <https://pouchdb.com/>`__.

Once all configuration is taken care of, the internal plugins are
initialised (see `server/plugins/index.js <https://github.com/hoodiehq/hoodie/blob/master/server/plugins/index.js>`__).
We define simple Hapi plugins for `logging <https://github.com/hoodiehq/hoodie/blob/master/server/plugins/logger.js>`__
and for `serving the app’s public assets and the Hoodie client <https://github.com/hoodiehq/hoodie/blob/master/server/plugins/public.js>`__.

Once everything is setup, the server is then started at the end of
`cli/start.js <https://github.com/hoodiehq/hoodie/blob/master/cli/index.js>`__
and the URL where hoodie is running is logged to the terminal.

Modules
~~~~~~~

Hoodie is a server built on top of `hapi <http://hapijs.com>`__ with
frontend APIs for account and store related tasks. It is split up in many small
modules with the goal to lower the barrier to new code contributors and to
share maintenance responsibilities.

1. server |server repository| |server build status| |server coverage
   status| |server dependency status|

    Hoodie’s core server logic as hapi plugin. It integrates Hoodie’s
    server core modules:
    `account-server <https://github.com/hoodiehq/hoodie-account-server>`__,
    `store-server <https://github.com/hoodiehq/hoodie-store-server>`__

    1. account-server |account-server repository| |account-server build
       status| |account-server coverage status| |account-server dependency
       status|

           `Hapi <http://hapijs.com/>`__ plugin that implements the `Account
           JSON API <http://docs.accountjsonapi.apiary.io>`__ routes and
           exposes a corresponding API at ``server.plugins.account.api.*``.

    2. store-server |store-server repository| |store-server build status|
       |store-server coverage status| |store-server dependency status|

           `Hapi <http://hapijs.com/>`__ plugin that implements `CouchDB’s
           Document
           API <https://wiki.apache.org/couchdb/HTTP_Document_API>`__.
           Compatible with `CouchDB <https://couchdb.apache.org/>`__ and
           `PouchDB <https://pouchdb.com/>`__ for persistence.

2. client |client repository| |client build status| |client coverage
   status| |client dependency status|

    Hoodie’s front-end client for the browser. It integrates Hoodie’s
    client core modules:
    `account-client <https://github.com/hoodiehq/hoodie-account-client>`__,
    `store-client <https://github.com/hoodiehq/hoodie-store-client>`__,
    `connection-status <https://github.com/hoodiehq/hoodie-connection-status>`__
    and `log <https://github.com/hoodiehq/hoodie-log>`__

    1. account-client |account-client repository| |account-client build
       status| |account-client coverage status| |account-client dependency
       status|

           Client for the `Account JSON
           API <http://docs.accountjsonapi.apiary.io>`__. It persists
           session information on the client and provides front-end
           friendly APIs for things like creating a user account,
           confirming, resetting a password, changing profile information,
           or closing the account.

    2. store-client |store-client repository| |store-client build status|
       |store-client coverage status| |store-client dependency status|

           Store client for data persistence and offline sync.

    3. connection-status |connection-status repository| |connection-status
       build status| |connection-status coverage status| |connection-status
       dependency status|

           Browser library to monitor a connection status. It emits
           ``disconnect`` & ``reconnect`` events if the request status
           changes and persists its status on the client.

    4. log |log repository| |log build status| |log coverage status| |log
       dependency status|

           JavaScript library for logging to the browser console. If
           available, it takes advantage of `CSS-based styling of console
           log
           outputs <https://developer.mozilla.org/en-US/docs/Web/API/Console#Styling_console_output>`__.

5. admin |admin repository| |admin build status| |admin dependency
   status|

    Hoodie’s built-in Admin Dashboard, built with
    `Ember.js <http://emberjs.com>`__

    1. admin-client |admin-client repository| |admin-client build status|
       |admin-client coverage status| |admin-client dependency status|

           Hoodie’s front-end admin client for the browser. Used in the
           Admin Dashboard, but can also be used standalone for custom admin
           dashboard.

.. |server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-server#readme
.. |server build status| image:: https://travis-ci.org/hoodiehq/hoodie-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-server
.. |server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-server?branch=master
.. |server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-server
.. |account-server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-account-server#readme
.. |account-server build status| image:: https://api.travis-ci.org/hoodiehq/hoodie-account-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-account-server
.. |account-server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-account-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-account-server?branch=master
.. |account-server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-account-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-server
.. |store-server repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-store-server#readme
.. |store-server build status| image:: https://travis-ci.org/hoodiehq/hoodie-store-server.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-store-server
.. |store-server coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-store-server/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-store-server?branch=master
.. |store-server dependency status| image:: https://david-dm.org/hoodiehq/hoodie-store-server.svg
   :target: https://david-dm.org/hoodiehq/hoodie-store-server
.. |client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-client#readme
.. |client build status| image:: https://travis-ci.org/hoodiehq/hoodie-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-client
.. |client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-client?branch=master
.. |client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-client
.. |account-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-account-client#readme
.. |account-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-account-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-account-client
.. |account-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-account-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-account-client?branch=master
.. |account-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-account-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-client
.. |store-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-store-client#readme
.. |store-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-store-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-store-client
.. |store-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-store-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-store-client?branch=master
.. |store-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-store-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-store-client
.. |pouchdb-hoodie-api repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/pouchdb-hoodie-api#readme
.. |pouchdb-hoodie-api build status| image:: https://travis-ci.org/hoodiehq/pouchdb-hoodie-api.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/pouchdb-hoodie-api
.. |pouchdb-hoodie-api coverage status| image:: https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-api/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/pouchdb-hoodie-api?branch=master
.. |pouchdb-hoodie-api dependency status| image:: https://david-dm.org/hoodiehq/pouchdb-hoodie-api.svg
   :target: https://david-dm.org/hoodiehq/pouchdb-hoodie-api
.. |pouchdb-hoodie-sync repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/pouchdb-hoodie-sync#readme
.. |pouchdb-hoodie-sync build status| image:: https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync
.. |pouchdb-hoodie-sync coverage status| image:: https://coveralls.io/repos/hoodiehq/pouchdb-hoodie-sync/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/pouchdb-hoodie-sync?branch=master
.. |pouchdb-hoodie-sync dependency status| image:: https://david-dm.org/hoodiehq/pouchdb-hoodie-sync.svg
   :target: https://david-dm.org/hoodiehq/pouchdb-hoodie-sync
.. |connection-status repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-connection-status#readme
.. |connection-status build status| image:: https://travis-ci.org/hoodiehq/hoodie-connection-status.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-connection-status
.. |connection-status coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-connection-status/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-connection-status?branch=master
.. |connection-status dependency status| image:: https://david-dm.org/hoodiehq/hoodie-connection-status.svg
   :target: https://david-dm.org/hoodiehq/hoodie-connection-status
.. |log repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-log#readme
.. |log build status| image:: https://travis-ci.org/hoodiehq/hoodie-log.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-log
.. |log coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-log/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-log?branch=master
.. |log dependency status| image:: https://david-dm.org/hoodiehq/hoodie-log.svg
   :target: https://david-dm.org/hoodiehq/hoodie-log
.. |admin repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-admin#readme
.. |admin build status| image:: https://travis-ci.org/hoodiehq/hoodie-admin.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-admin
.. |admin dependency status| image:: https://david-dm.org/hoodiehq/hoodie-admin.svg
   :target: https://david-dm.org/hoodiehq/hoodie-admin
.. |admin-client repository| image:: https://assets-cdn.github.com/images/icons/emoji/octocat.png
   :target: https://github.com/hoodiehq/hoodie-admin-client#readme
.. |admin-client build status| image:: https://travis-ci.org/hoodiehq/hoodie-admin-client.svg?branch=master
   :target: https://travis-ci.org/hoodiehq/hoodie-admin-client
.. |admin-client coverage status| image:: https://coveralls.io/repos/hoodiehq/hoodie-admin-client/badge.svg?branch=master
   :target: https://coveralls.io/r/hoodiehq/hoodie-admin-client?branch=master
.. |admin-client dependency status| image:: https://david-dm.org/hoodiehq/hoodie-admin-client.svg
   :target: https://david-dm.org/hoodiehq/hoodie-account-client
