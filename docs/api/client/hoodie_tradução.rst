hoodie
======


Introdução
------------

Este documento descreve a funcionalidade do objeto base do Hoodie. Ele disponibiliza diversos métodos auxiliares para lidar com o tratamento de eventos e a conectividade, além de um gerador de identificadores únicos e um mecanismo para definir o endpoint com o qual o Hoodie se comunica.

Inicialização
--------------

O Hoodie Client mantém o estado no navegador, como o ID do usuário atual, a sessão ou o status da conexão com o backend.

.. code:: js

    hoodie.account.get('session').then(function (session) {
      if (session) {
        // user is signed in
      } else {
        // user is signed out
      }
    })

O Hoodie integra os módulos do cliente:

-  `The account API <hoodie.account.html>`__
-  `The store API <hoodie.store.html>`__
-  `The connectionStatus API <hoodie.connection-status.html>`__
-  `The log API <hoodie.log.html>`__

Example
-------

.. code:: js

    var Hoodie = require('@hoodie/client')
    var hoodie = new Hoodie({
      url: 'https://myhoodieapp.com',
      PouchDB: require('pouchdb')
    })

    hoodie.account.signUp({
      username: 'pat@Example.com',
      password: 'secret'
    }).then(function (accountAttributes) {
      hoodie.log.info('Signed up as %s', accountAttributes.username)
    }).catch(function (error) {
      hoodie.log.error(error)
    })

Constructor
-----------

.. code:: js

    new Hoodie(options)

+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument                     | Type           | Description                                                                                                                                                                                                  | Required |
+==============================+================+==============================================================================================================================================================================================================+==========+
| options.PouchDB              | Constructor    | PouchDB constructor, see also `PouchDB custom builds <https://pouchdb.com/custom.html>`_                                                                                                                     | Yes      |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.url                  | String         | Set to hostname where Hoodie server runs, if your app runs on a different host                                                                                                                               | Yes      |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.account              | String         | `account options <https://github.com/hoodiehq/hoodie-account-client#constructor>`_. ``options.url`` is always set to ``hoodie.url`` + '/account/api'                                                         | No       |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.store                | String         | `store options <https://github.com/hoodiehq/hoodie-account-client#constructor>`_. ``options.PouchDB`` is always set to `Hoodie Client’s constructor                                                          | No       |
|                              |                | <https://github.com/hoodiehq/hoodie-client#constructor>`_’s options.PouchDB. ``options.dbName`` is always set to ``hoodie.account.id``. ``options.remote`` is always set to ``hoodie.url`` + '/store/api'.   |          |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.task                 | String         | `task options <https://github.com/hoodiehq/hoodie-client-task#constructor>`_. options.userId is always set to hoodie.account.id. options.remote is always set to hoodie.url + '/task/api'                    | No       |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.connectionStatus     | String         | `connectionStatus options <https://github.com/hoodiehq/hoodie-connection-status#constructor>`_. ``options.url`` is always set to ``hoodie.url`` + '/connection-status/api'. ``options.method`` is always set | No       |
|                              |                | to ``HEAD``                                                                                                                                                                                                  |          |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

hoodie.url
----------

`Read-only`

.. code:: js

    hoodie.url

full url to the hoodie server, e.g. ``http://example.com/hoodie``

hoodie.account
--------------

``hoodie.account`` is an instance of `hoodie-account-client <https://github.com/hoodiehq/hoodie-account-client>`_. 
See `account API <https://github.com/hoodiehq/hoodie-account-client#api>`_

hoodie.store
------------

``hoodie.store`` is an instance of `hoodie-store <https://github.com/hoodiehq/hoodie-store>`_. See `store API <https://github.com/hoodiehq/hoodie-store#api>`_

hoodie.connectionStatus
-----------------------

``hoodie.connectionStatus`` is an instance of `hoodie-connection-status <https://github.com/hoodiehq/hoodie-connection-status>`_. See `connectionStatus API <https://github.com/hoodiehq/hoodie-connection-status#api>`_

hoodie.log
----------

``hoodie.log`` is an instance of `hoodie-log <https://github.com/hoodiehq/hoodie-log>`_. See `log API <https://github.com/hoodiehq/hoodie-log#api>`_

hoodie.request
--------------

Sends an http request

.. code:: js

    hoodie.request(url)
    // or
    hoodie.request(options)

+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument                     | Type            | Description                                                                                                                                                                                                  | Required |
+==============================+=================+==============================================================================================================================================================================================================+==========+
| url                          | String          | Relative path or full URL. A path must start with ``/`` and sends a ``GET`` request to the path, prefixed by ``hoodie.url``. In case a full URL is passed, a ``GET`` request to the url is sent.             | Yes      |
+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.url                  | String          | Relative path or full URL. A path must start with ``/`` and sends a ``GET`` request to the path, prefixed by ``hoodie.url``. In case a full URL is passed, a ``GET`` request to the url is sent.             | Yes      |
+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.method               | String          | `Defaults to` ``GET``. One of ``GET``, ``HEAD``, ``POST``, ``PUT``, ``DELETE``.                                                                                                                              | No       |
+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.data                 | Object, Array,  | For ``PUT`` and ``POST`` requests, an optional payload can be sent. It will be stringified before sending the request.                                                                                       | No       |
|                              | String or Number|                                                                                                                                                                                                              |          |
+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| options.headers              | Object          | Map of Headers to be sent with the request.                                                                                                                                                                  | No       |
+------------------------------+-----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

Examples

.. code:: js

    // sends a GET request to hoodie.url + '/foo/api/bar'
    hoodie.request('/foo/api/bar')
    // sends a GET request to another host
    hoodie.request('https://example.com/foo/bar')
    // sends a PATCH request to /foo/api/bar
    hoodie.request({
      method: 'PATCH',
      url: '/foo/api/bar',
      headers: {
        'x-my-header': 'my value'
      },
      data: {
        foo: 'bar'
      }
    })

hoodie.plugin
-------------

Initialise hoodie plugin

.. code:: js

    hoodie.plugin(methods)
    hoodie.plugin(plugin)

+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument                     | Type           | Description                                                                                                                                                                                                  | Required |
+==============================+================+==============================================================================================================================================================================================================+==========+
| methods                      | Object         | Method names as keys, functions as values. Methods get directly set on hoodie, e.g. hoodie.plugin({foo: function () {}}) sets hoodie.foo to function () {}                                                   | Yes      |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| plugins                      | Function       | The passed function gets called with `hoodie` as first argument, and can directly set new methods / properties on it.                                                                                        | Yes      |
+------------------------------+----------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

Examples

.. code:: js

    hoodie.plugin({
      sayHi: function () { alert('hi') }
    })
    hoodie.plugin(function (hoodie) {
      hoodie.sayHi = function () { alert('hi') }
    })

hoodie.on
---------

Subscribe to event.

.. code:: js

    hoodie.on(eventName, handler)

Example

.. code:: js

    hoodie.on('account:signin', function (accountProperties) {
      alert('Hello there, ' + accountProperties.username)
    })

hoodie.one
----------

Call function once at given event.

.. code:: js

    hoodie.one(eventName, handler)

Example

.. code:: js

    hoodie.one('mycustomevent', function (options) {
      console.log('foo is %s', options.bar)
    })
    hoodie.trigger('mycustomevent', { foo: 'bar' })
    hoodie.trigger('mycustomevent', { foo: 'baz' })
    // logs "foo is bar"
    // DOES NOT log "foo is baz"

hoodie.off
----------

Removes event handler that has been added before

.. code:: js
    
    hoodie.off(eventName, handler)
    
Example

.. code:: js

    hoodie.off('connectionstatus:disconnect', showNotification)
    
hoodie.trigger
--------------

Trigger custom events

.. code:: js

    hoodie.trigger(eventName[, option1, option2, ...])

Example

.. code:: js

    hoodie.trigger('mycustomevent', { foo: 'bar' })

Events
------

+------------------------+------------------------------------------+
| Event                  | Decription                               |
+========================+==========================================+
| ``account:*``          | events, see account events               |
+------------------------+------------------------------------------+
| ``store:*``            | events, see store events                 |
+------------------------+------------------------------------------+
| ``connectionStatus:*`` | events, see connectionStatus events      |
+------------------------+------------------------------------------+

Testing
-------

Local setup

:: 
    
    git clone https://github.com/hoodiehq/hoodie-client.git
    cd hoodie-client
    npm install

Run all tests

::

    npm test

Run test from one file only

::

    node tests/specs/id



