hoodie.store
============

If you want to do anything with data in Hoodie, this is where it
happens and this is the Hoodie Client for data persistence & offline sync.

Example
-------

.. code:: js

    var Store = require('@hoodie/store-client')
        var store = new Store('mydbname', {
        PouchDB: require('pouchdb'),
        remote: 'http://localhost:5984/mydbname'
    })

Or

.. code:: js

    var PresetStore = Store.defaults({
        PouchDB: require('pouchdb'),
        remoteBaseUrl: 'http://localhost:5984'
    })
    var store = new PresetStore('mydb')

Store.defaults
--------------

.. code:: js

    Store.defaults(options)

+---------------------------+----------------+------------------------------------------------------------------------+---------------------+
| Argument                  | Type           | Description                                                            | Required            |
+===========================+================+========================================================================+=====================+
| ``options.remoteBaseUrl`` | String         | Base url to CouchDB. Will be used as remote prefix for store instances | No                  |
+---------------------------+----------------+------------------------------------------------------------------------+---------------------+
| options.PouchDB           | Constructor    | `PouchDB custom builds <https://pouchdb.com/custom.html>`_             | Yes                 |
+---------------------------+----------------+------------------------------------------------------------------------+---------------------+

Returns a custom Store Constructor with passed default options.

Example

.. code:: js

    var PresetStore = Store.defaults({
        remoteBaseUrl: 'http://localhost:5984'
    })
    var store = new PresetStore('mydb')
    store.sync() // will sync with http://localhost:5984/mydb

Constructor
-----------

.. code:: js

    new Store(dbName, options)

+---------------------+-------------+--------------------------------+------------------------------------------------------------+
| Argument            | Type        | Description                    | Required                                                   |
+=====================+=============+================================+============================================================+
| ``dbName``          | String      | name of the database           | Yes                                                        |
+---------------------+-------------+--------------------------------+------------------------------------------------------------+
| ``options.remote``  | String      | name or URL of remote database | Yes (unless remoteBaseUrl is preset, see Store.defaults)   |
+---------------------+-------------+--------------------------------+------------------------------------------------------------+
| ``options.PouchDB`` | Constructor | PouchDB custom builds          | Yes (unless preset using Store.defaults))                  |
+---------------------+-------------+--------------------------------+------------------------------------------------------------+

Returns store API.

Example

.. code:: js

    var Store = require('@hoodie/store-client')
    var store = new Store('mydb', { remote: 'http://localhost:5984/mydb' })
    store.sync() // will sync with http://localhost:5984/mydb

store.add(properties)
---------------------

.. code:: js

    store.add(properties)

+--------------------+--------+-------------------------------------------------+------------+
| Argument           | Type   | Description                                     | Required   |
+--------------------+--------+-------------------------------------------------+------------+
| ``properties``     | Object | properties of document                          | Yes        |
+--------------------+--------+-------------------------------------------------+------------+
| ``properties._id`` | String | If set, the document will be stored at given id | No         |
+--------------------+--------+-------------------------------------------------+------------+

Resolves with properties and adds _id (unless provided), createdAt and updatedAt properties.

.. code:: js

    {
        "foo": "bar",
        "hoodie": {
          "createdAt": "2016-05-09T12:00:00.000Z",
          "updatedAt": "2016-05-09T12:00:00.000Z"
        },
        "_id": "12345678-1234-1234-1234-123456789ABC",
        "_rev": "1-b1191b8cfee045f495594b1cf2823683"
    }

Rejects with:

🐕 Add expected Errors: `#102 <https://github.com/hoodiehq/hoodie-store-client/issues/102>`_

table

Example

.. code:: js

    store.add({foo: 'bar'}).then(function (doc) {
        alert(doc.foo) // bar
    }).catch(function (error) {
        alert(error)
    })

store.add(arrayOfProperties)
----------------------------

.. code:: js

    store.add(arrayOfProperties)

+-----------------------+-------+------------------------------------------------+------------+
| Argument              | Type  | Description                                    | Required   |
+=======================+=======+================================================+============+
| ''arrayOfProperties'' | Array | Array of properties, see store.add(properties) | Yes        |
+-----------------------+-------+------------------------------------------------+------------+

Resolves with properties and adds _id (unless provided), createdAt and updatedAt properties. Resolves with array of properties items if called with propertiesArray.

.. code:: js

    {
        "foo": "bar",
        "hoodie": {
          "createdAt": "2016-05-09T12:00:00.000Z",
          "updatedAt": "2016-05-09T12:00:00.000Z"
        },
        "_id": "12345678-1234-1234-1234-123456789ABC",
        "_rev": "1-b1191b8cfee045f495594b1cf2823683"
    }

Rejects with:

🐕 Add expected Errors: #102

Example: add single document

.. code:: js

    store.add({foo: 'bar'}).then(function (doc) {
        alert(doc.foo) // bar
    }).catch(function (error) {
        alert(error)
    })

Example: add multiple documents

.. code:: js

    store.add([{foo: 'bar'}, {bar: 'baz'}]).then(function (docs) {
        alert(docs.length) // 2
    }).catch(function (error) {
        alert(error)
    })

store.find(id)
--------------

.. code::

    store.find(id)

+----------+--------+-----------------------+----------+
| Argument | Type   | Description           | Required |
+==========+========+=======================+==========+
| ``id``   | String | Unique id of document | Yes      |
+----------+--------+-----------------------+----------+

Resolves with properties

.. code::

    {
        "id": "12345678-1234-1234-1234-123456789ABC",
        "foo": "bar",
        "createdAt": "2016-05-09T12:00:00.000Z",
        "updatedAt": "2016-05-09T12:00:00.000Z"
    }

Rejects with:

🐕 Add expected Errors: #102

Example

.. code::

    store.find('12345678-1234-1234-1234-123456789ABC').then(function (doc) {
        alert(doc.id)
    }).catch(function (error) {
        alert(error)
    })

store.find(doc)
---------------

.. code::

    store.find(doc)

+----------+--------+---------------------------+----------+
| Argument | Type   | Description               | Required |
+==========+========+===========================+==========+
| ``doc``  | Object | document with id property | Yes      |
+----------+--------+---------------------------+----------+

Resolves with properties

.. code:: js

    {
        "id": "12345678-1234-1234-1234-123456789ABC",
        "foo": "bar",
        "createdAt": "2016-05-09T12:00:00.000Z",
        "updatedAt": "2016-05-09T12:00:00.000Z"
    }

Rejects with:

🐕 Add expected Errors: #102

.. code:: js

    store.find(doc).then(function (doc) {
        alert(doc.id)
    }).catch(function (error) {
        alert(error)
    })

store.find(idsOrDocs)
---------------------

.. code::

    store.find(idsOrDocs)

+---------------+-------+--------------------------------------------+-------------+
| Argument      | Type  | Description                                | Required    |
+===============+=======+============================================+=============+
| ``idsOrDocs`` | Array | Array of id (String) or doc (Object) items | Yes         |
+---------------+-------+--------------------------------------------+-------------+

Resolves with array of properties

.. code:: js

    [{
        "id": "12345678-1234-1234-1234-123456789ABC",
        "foo": "bar",
        "createdAt": "2016-05-09T12:00:00.000Z",
        "updatedAt": "2016-05-09T12:00:00.000Z"
    }]

Rejects with:

🐕 Add expected Errors: #102

Example

.. code:: js

    store.find(doc).then(function (doc) {
        alert(doc.id)
    }).catch(function (error) {
        alert(error)
    })

Testing
-------

Local setup

::

    git clone https://github.com/hoodiehq/hoodie-store-client.git
    cd hoodie-store-client
    npm install

In Node.js

Run all tests and validate JavaScript Code Style using standard

::

    npm test

To run only the tests

::

    npm run test:node

Run tests in browser

::

    npm run test:browser:local

This will start a local server. All tests and coverage will be run at http://localhost:8080/__zuul
