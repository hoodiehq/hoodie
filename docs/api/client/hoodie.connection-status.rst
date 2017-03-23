hoodie.connectionStatus
=======================

``hoodie-connection-status`` is a browser library to monitor a connection status. 
It emits ``disconnect`` & ``reconnect`` events if the request status changes and persists its status.

Example
-------

.. code:: js

    var connectionStatus = new ConnectionStatus('https://example.com/ping')

    connectionStatus.on('disconnect', showOfflineNotification)
    connectionStatus.on('reconnect reset', hideOfflineNotification)
    myOtherRemoteApiThing.on('error', connectionStatus.check)

.. _label-Constructor:

Constructor
-----------

.. code:: js

    new ConnectionStatus(options)

+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| Argument                          | Type       | Description                                                                                                                                                      | Required                                                                             |
+===================================+============+==================================================================================================================================================================+======================================================================================+
| ``options.url``                   | String     | Full url to send pings to                                                                                                                                        | Yes                                                                                  |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.method``                | String     | Defaults to `HEAD`. Must be valid http verb like ``'GET'`` or ``'POST'`` (case insensitive)                                                                      | No                                                                                   |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.interval``              | Number     | Interval in ms. If set a request is send immediately. The interval starts after each request response. Can also be set to an object to differentiate intervals   |                                                                                      |
|                                   |            | by connection status, see below                                                                                                                                  | No                                                                                   |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.interval.connected``    | Number     | Interval in ms while ``connectionStatus.ok`` is not ``false``. If set, a request is send immediately. The interval starts after each request response.           | No                                                                                   |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.interval.disconnected`` | Number     | Interval in ms while ``connectionStatus.ok`` is ``false``. If set, a request is send immediately. The interval starts after each request response.               | No                                                                                   |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.cache``                 | Object or  | Object with ``.get()``, ``.set(properties)`` and ``.unset()`` methods to persist the connection status. Each method must return a promise,                       |                                                                                      |
|                                   | ``false``  | ``.get()`` must resolve with the current state or an empty object.                                                                                               | Defaults                                                                             |
|                                   |            | If set to ``false`` the connection status will not be persisted.                                                                                                 | to a `localStorage-based API <https://github.com/gr2m/async-get-set-store>`_         |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+
| ``options.cacheTimeout``          | Number     | time in ms after which a cache shall be invalidated. When invalidated on initialisation, a ``reset`` event gets triggered on next tick.                          | No                                                                                   |
+-----------------------------------+------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+--------------------------------------------------------------------------------------+

Example

.. code:: js

    var connectionStatus = new ConnectionStatus('https://example.com/ping')

    connectionStatus.on('disconnect', showOfflineNotification)
    connectionStatus.check()

.. _label-connectionStatus-ready:

connectionStatus.ready
----------------------

`Read-only`

Promise that resolves once the ConnectionStatus instance loaded its current state from the cache.

connectionStatus.ok
-------------------

`Read-only`

.. code:: js

    connectionStatus.ok

* Returns ``undefined`` if no status yet
* Returns ``true`` last check responded ok
* Returns ``false`` if last check failed

The state is persisted in cache.

connectionStatus.isChecking
---------------------------

`Read-only`

.. code:: js

    connectionStatus.isChecking

* Returns ``undefined`` if status not loaded yet, see :ref:`label-connectionStatus-ready`   
* Returns ``true`` if connection is checked continuously
* Returns ``false`` if connection is not checked continuously

connectionStatus.check(options)
-------------------------------

.. code:: js

    connectionStatus.check(options)

+---------------------+--------+-------------------------------------------------------------------------+----------+
| Argument            | Type   | Description                                                             | Required |
+=====================+========+=========================================================================+==========+
| ``options.timeout`` | Number | Time in ms after which a ping shall be aborted with a ``timeout`` error | No       |
+---------------------+--------+-------------------------------------------------------------------------+----------+

Resolves without value.

Rejects with:

+---------------------+-------------------------+-----------------------------+
| name                | status                  | message                     |
+=====================+=========================+=============================+
| ``TimeoutError``    | 0                       | Connection timeout          |
+---------------------+-------------------------+-----------------------------+
| ``ServerError``     | `as returned by server` | `as returned by server`     |
+---------------------+-------------------------+-----------------------------+
| ``ConnectionError`` | ``undefined``           | Server could not be reached |
+---------------------+-------------------------+-----------------------------+

Example

.. code:: js

    connectionStatus.check()

    .then(function () {
    // Connection is good, connectionStatus.ok is true
    })

    .catch(function () {
    // Cannot connect to server, connectionStatus.ok is false
    })

connectionStatus.startChecking(options)
---------------------------------------

Starts checking connection continuously

.. code:: js

    connectionStatus.startChecking(options)

+-----------------------------------+--------+--------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument                          | Type   | Description                                                                                                                                            | Required |
+===================================+========+========================================================================================================================================================+==========+
| ``options.interval``              | Number | Interval in ms. The interval starts after each request response. Can also be set to an object to differentiate interval by connection state, see below | Yes      |
+-----------------------------------+--------+--------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``options.interval.connected``    | Number | Interval in ms while ``connectionStatus.ok`` is not ``false``. The interval starts after each request response.                                        | No       |
+-----------------------------------+--------+--------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``options.interval.disconnected`` | Number | Interval in ms while ``connectionStatus.ok`` is ``false``. The interval starts after each request response.                                            | No       |
+-----------------------------------+--------+--------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``options.timeout``               | Number | Time in ms after which a ping shall be aborted with a ``timeout`` error.                                                                               | No       |
+-----------------------------------+--------+--------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

Resolves without values.

Example

.. code:: js

    connectionStatus.startChecking({interval: 30000})
        .on('disconnect', showOfflineNotification)

connectionStatus.stopChecking()
-------------------------------

Stops checking connection continuously.

.. code:: js

    connectionStatus.stopChecking()

Resolves without values. Does not reject.

connectionStatus.reset(options)
-------------------------------

Clears status & cache, aborts all pending requests.

.. code:: js

    connectionStatus.reset(options)

``options`` is the same as in :ref:`label-Constructor`

Resolves without values. Does not reject.

Example

.. code:: js

    connectionStatus.reset(options).then(function () {
        connectionStatus.ok === undefined // true
    })

Events

+------------+----------------------------------------------------------------------------+
| disconnect | Ping fails and ``connectionStatus.ok`` isn’t ``false``                     |
+------------+----------------------------------------------------------------------------+
| reconnect  | Ping succeeds and ``connectionStatus.ok`` is ``false``                     |
+------------+----------------------------------------------------------------------------+
| reset      | Cache invalidated on initialisation or ``connectionStatus.reset()`` called |
+------------+----------------------------------------------------------------------------+

Example

.. code:: js

    connectionStatus.on('disconnect', function () {})
    connectionStatus.on('reconnect', function () {})
    connectionStatus.on('reset', function () {})

Testing
-------

Local setup

::

    git clone git@github.com:hoodiehq/hoodie-connection-status.git
    cd hoodie-connection-status
    npm install

Run all tests and code style checks

::

    npm test

Run all tests on file change

::

    npm run test:watch

Run specific tests only

::

    # run unit tests
    node tests/specs 

    # run .check() unit tests
    node tests/specs/check 

    # run walkthrough integration test
    node tests/integration/walkthrough 