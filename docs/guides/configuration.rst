Configuration
=============

Your Hoodie back-end can be configured using default options that are part of
your repository as well as using hidden files, CLI arguments and environment variables.

Options
~~~~~~~

Here is a list of all available options


+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Option          | Default value                    | CLI argument             | ENV variable             | description                                                                                                                                                     |
+=================+==================================+==========================+==========================+=================================================================================================================================================================+
| address         | ``'127.0.0.1'``                  | ``--address``            | ``hoodie_address``       | Address to which Hoodie binds                                                                                                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| data            | ``'.hoodie'``                    | ``--data``               | ``hoodie_data``          | Data path                                                                                                                                                       |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrl           | –                                | ``--dbUrl``              | ``hoodie_dbUrl``         | If provided, uses external CouchDB. Include credentials in `dbUrl`, or use `dbUrlUsername` and `dbUrlPassword`. Sets ``dbAdapter`` to ``pouchdb-adapter-http``  |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrlUsername   | –                                | ``dbUrlUsername``        | ``hoodie_dbUrlUsername`` | If ``dbUrl`` is set, you can use ``dbUrlUsername`` to set the username to use when making requests to CouchDB                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbUrlPassword   | –                                | ``dbUrlPassword``        | ``hoodie_dbUrlPassword`` | If ``dbUrl`` is set, you can use ``dbUrlPassword`` to set the password to use when making requests to CouchDB                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| dbAdapter       | ``'pouchdb-adapter-fs'``         | ``--dbAdapter``          | ``hoodie_dbAdapter``     | Sets default `PouchDB adapter <https://pouchdb.com/adapters.html>` unless ``inMemory`` or ``dbUrl`` set                                                         |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| loglevel        | ``'warn'``                       | ``--loglevel``           | ``hoodie_loglevel``      | One of: silent, error, warn, http, info, verbose, silly                                                                                                         |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| inMemory        | ``false``                        | ``-m``, ``--inMemory``   | ``hoodie_inMemory``      | Whether to start the PouchDB Server in memory. Sets ``dbAdapter`` to ``pouchdb-adapter-memory``                                                                 |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| port            | ``8080``                         | ``--port``               | ``hoodie_port``          | Port-number to run the Hoodie App on                                                                                                                            |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| public          | ``'public'``                     | ``--public``             | ``hoodie_public``        | path to static assets                                                                                                                                           |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| url             | -                                | ``--url``                | ``hoodie_url``           | Optional: external URL at which Hoodie Server is accessible (e.g. ``http://myhoodieapp.com``)                                                                   |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| adminPassword   | -                                | ``--adminPassword``      | ``hoodie_adminPassword`` | Password to login to Admin Dashboard. Login is not possible unless set                                                                                          |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+
| name            | ``package.json``'s name property | ``--name``               | ``hoodie_name``          | Name your application.                                                                                                                                          |
+-----------------+----------------------------------+--------------------------+--------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------+

Defaults
--------

Default options are set in your app’s ``package.json`` file, using the
``"hoodie"`` key. Here is an example with all available options and their
default values

.. code:: json

    {
      "hoodie": {
        "address": "127.0.0.1",
        "port": 8080,
        "data": ".hoodie",
        "public": "public",
        "dbUrl": "",
        "dbAdapter": "pouchdb-adapter-fs",
        "inMemory": false,
        "loglevel": "warn",
        "url": "",
        "adminPassword": "",
        "name": "my-hoodie-app"
      }
    }

.hoodierc
~~~~~~~~~

The ``.hoodierc`` can be used to set configuration when running your Hoodie
backend in that folder. It should not be committed to your repository.

The content can be in JSON or INI format. See the `rc package on npm <https://www.npmjs.com/package/rc>`__
for more information

CLI arguments and environment variables
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To pass CLI options when starting Hoodie, you have to separate them with ``--``, for example:

.. code:: bash

    $ npm start -- --port=8090 --inMemory

All environment variables are prefixed with ``hoodie_``. So to set the port to
``8090`` and to start Hoodie in memory mode, you have to

- set the ``hoodie_port`` environment variable to ``8090``
- set the ``hoodie_inMemory`` environment variable to ``true``

Hoodie CLI is using `rc <https://www.npmjs.com/package/rc>`__ for configuration,
so the same options can be set with environment variables and config files.
Environment variables are prefixed with ``hoodie_``.

The priority of configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1. Command line arguments
2. Environment variables
3. ``.hoodierc`` files
4. Your app’s defaults form the ``"hoodie"`` key in ``"package.json"``
5. Hoodie’s default values as shown in table above
