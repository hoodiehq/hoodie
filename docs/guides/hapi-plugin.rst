Using Hoodie as hapi plugin
===========================

Here is an example usage of Hoodie as a hapi plugin:

.. code:: js

    var Hapi = require('hapi')
    var hoodie = require('hoodie').register
    var PouchDB = require('pouchdb-core')
      .plugin(require('pouchdb-mapreduce'))
      .plugin(require('pouchdb-adapter-memory'))
  
    var server = new Hapi.Server()
    server.connection({
      host: 'localhost',
      port: 8000
    })

    server.register({
      register: hoodie,
      options: { // pass options here
        inMemory: true,
        public: 'dist',
        PouchDB: PouchDB
      }
    }, function (error) {
      if (error) {
        throw error
      }

      server.start(function (error) {
        if (error) {
          throw error
        }

        console.log(('Server running at:', server.info.uri))
      })
    })

The available options are

+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| option                  | default       | description                                                                                                                                                                                                 |
+=========================+===============+=============================================================================================================================================================================================================+
| **PouchDB**             | –             | `PouchDB constructor`_. See also `custom PouchDB builds`_                                                                                                                                                   |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **paths.data**          | ``'.hoodie'`` | Data path                                                                                                                                                                                                   |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **paths.public**        | ``'public'``  | Public path                                                                                                                                                                                                 |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **adminPassword**       | –             | Password to login to Admin Dashboard. Login is not possible if ``adminPassword`` option is not set                                                                                                          |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **inMemory**            | ``false``     | If set to true, configuration and other files will not be read from / written to the file system                                                                                                            |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **client**              | ``{}``        | `Hoodie Client`_ options. ``client.url `` is set based on hapi’s ``server.info.host``                                                                                                                       |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **account**             | ``{}``        | `Hoodie Account Server`_ options. ``account.admins``, ``account.secret`` and ``account.usersDb`` are set based on ``db`` option above                                                                       |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **store**               | ``{}``        | `Hoodie Store Server`_ options. ``store.couchdb``, ``store.PouchDB`` are set based on ``db`` option above. ``store.hooks.onPreAuth` ` is set to bind user authentication for Hoodie Account to Hoodie Store |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **plugins**             | ``[]``        | Array of npm names or paths of locations containing plugins. See also `Hoodie plugins docs`_                                                                                                                |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| **app**                 | ``{}``        | App specific options for plugins                                                                                                                                                                            |
+-------------------------+---------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+

.. _PouchDB constructor: https://pouchdb.com/api.html#defaults
.. _custom PouchDB builds: https://pouchdb.com/2016/06/06/introducing-pouchdb-custom-builds.html
.. _Hoodie Client: https://github.com/hoodiehq/hoodie-client#constructor
.. _Hoodie Account Server: https://github.com/hoodiehq/hoodie-account-server/tree/master/plugin#options
.. _Hoodie Store Server: https://github.com/hoodiehq/hoodie-store-server#options
.. _Hoodie plugins docs: http://docs.hood.ie/en/latest/guides/plugins.html
