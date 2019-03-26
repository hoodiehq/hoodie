Plugins
=======

You can extend your Hoodie app in two ways

1. App-specific plugins
2. 3rd party plugins

App-specific plugins
~~~~~~~~~~~~~~~~~~~~

You can extend your Hoodie’s client by creating the file ``hoodie/client/index.js``
in your app’s repository, which should export a `Hoodie Client plugin <http://docs.hood.ie/en/latest/api/client/hoodie.html#hoodie-plugin>`.
It will dynamically be bundled into your client ``/hoodie/client.js``.


Example

.. code:: js

    // /hoodie/client/index.js
    module.exports = function (hoodie) {
      hoodie.hello = function (what) {
        return Promise.resolve('Hello, ' + (what || 'world') + '!')
      }
    }

You can extend your Hoodie’s server routes and API by creating ``hoodie/server/index.js``
in your app’s, which should export a `hapi plugin <https://hapijs.com/tutorials/plugins>`_.
All server routes defined in the plugin will be prefixed with ``/hoodie/<app name>`` where <app name> is your package.json "name" key.

Example

.. code:: js

    module.exports.register = register
    module.exports.register.attributes = {
      name: 'hoodie-app-plugin'
    }

    function register (server, options, next) {
      server.route({
        method: 'GET',
        path: '/api',
        handler: function (request, reply) {
          reply('Hello, world!')
        }
      })

      next()
    }

Try it it at http://localhost:8080/hoodie/<app name>/api

3rd party plugins
~~~~~~~~~~~~~~~~~

Hoodie plugins are `npm modules <https://www.npmjs.com/search?q=hoodie-plugin->`. We recommend to prefix your plugin names with
``hoodie-plugin-``, but it’s not required. The folder structure is the same as
for app-specific plugins:

.. code:: bash
    ├── package.json
    └── hoodie
        ├── client.js    # or: hoodie/client/index.js
        ├── server.js    # or: hoodie/server/index.js
        └── public
            └── index.html

The server plugin must be loadable via ``require('hoodie-plugin-foo/hoodie/server')``.
A Hoodie server plugin is a `hapi plugin <http://hapijs.com/tutorials/plugins>`_.
The client plugin must be loadable via ``require('hoodie-plugin-foo/hoodie/client')``
A Hoodie client plugin can be a function or an object,
it will be passed into `hoodie.plugin() <http://docs.hood.ie/en/latest/api/client/hoodie.html#hoodie-plugin>`

Hoodie plugins can extend the Hoodie client, the Hoodie server and provide a
web UI for `/hoodie/<plugin name>`. All extension points are optional.
The ``hoodie/public`` folder will be exposed at `/hoodie/<plugin name>` by the
server if it exists. All server routes will be prefixed with `/hoodie/<plugin name>`.

``<plugin name>`` is the name property in your ``package.json`` file, but can be
overridden with the ``hoodie.name`` property.

After installing and adding a Hoodie plugin to your app’s dependencies, you also
have to enable it by adding it to the ``hoodie.plugins`` array in your app’s
`package.json` file. The names are the npm package names.

.. code:: json
    {
      "name": "my-app",
      ...
      "hoodie": {
        "plugins": ["hoodie-plugin-hello-world"]
      }
    }

The order in which server/client plugins are loaded is

1. core modules (account, store, task)
2. 3rd party plugins (npm dependencies)
3. app plugins

For an example plugin, have a look at Hoodie’s `"Hello, world!" <https://github.com/hoodiehq/hoodie-plugin-hello-world>`_ plugin .
