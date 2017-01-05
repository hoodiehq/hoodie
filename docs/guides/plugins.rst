Plugins
=======

You can extend your Hoodie backend in two ways

1. App-specific plugins
2. 3rd party plugins

App-specific plugins
~~~~~~~~~~~~~~~~~~~~

You can extend your Hoodie’s client by creating the file ``hoodie/client/index.js``
in your app’s repository, which should export a `Hoodie Client plugin <https://github.com/hoodiehq/hoodie-client#hoodieplugin>`.
It will dynamically be bundled into your client accessible at the ``/hoodie/client.js`` route.

You can extend your Hoodie’s server routes and API by creating ``hoodie/server/index.js``
in your app’s, which should export a `hapi plugin <https://hapijs.com/tutorials/plugins>`.

3rd party plugins
~~~~~~~~~~~~~~~~~

Hoodie will soon support loading 3rd party plugins from npm packages. You can
watch `this pull request <https://github.com/hoodiehq/hoodie/pull/482>`__ for updates.

To get an idea how 3rd party plugins will work and look like, have a look at
https://github.com/hoodiehq/hoodie-plugin-example
