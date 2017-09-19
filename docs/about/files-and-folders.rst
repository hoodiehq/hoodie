Files & Folders
===============

package.json
~~~~~~~~~~~~

The ``package.json`` file describes your project in `JSON <http://www.json.org/>`_.
It its dependencies, scripts needed to run or use or develop on your project, and
other information described in `the NPM documentation for package.json
<https://docs.npmjs.com/files/package.json>`_.

The file is created when you run this:

.. code:: bash

  npm init


It will prompt you for details about your projects, such as its name,
version, description, test suite, author, and software license. Fill it
out or leave it for later. You can always edit the file directly.

Hoodie modifies your package.json when it is installed to add a "start"
script that starts your server by running `hoodie` without options.

When adding new dependencies, you can save their name and version information
to ``package.json`` by using the ``--save`` flag, like this:

.. code:: bash

  npm install --save <package name>

With your dependencies documented in ``package.json``, you can install all
your dependencies at once by running this:

.. code:: bash

  npm install

This makes it very easy for others to get your project up and running quickly.

README.md
~~~~~~~~~

The ``README.md`` file describes your project in `Markdown
<https://daringfireball.net/projects/markdown/syntax>`_. It is intended for
humans to read, and should include information about what your project is or
does, how to install it, use it, test it, and contribute to it if appropriate.

For an example readme, try the one used by `Hoodie
<https://github.com/hoodiehq/hoodie/#hoodie>`_ :)

.hoodie/
~~~~~~~~

The ``.hoodie/`` folder contains compiled client assets and database records,
including query indexes. You should never need to modify these files directly.

hoodie/
~~~~~~~

The ``hoodie/`` folder contains the JavaScript code that runs in your server
and the user's browser, and the code that they share. Hoodie uses two files
as hooks to package code for the client and server:

- ``hoodie/client/index.js`` is included as a `Hoodie plugin
  <http://docs.hood.ie/en/latest/guides/plugins.html>`_
  using `Browserify <http://browserify.org/>`_, so it can use ``require()``
  to include code from dependencies or other folders.
- ``hoodie/server/index.js`` is included in the server as a `Hapi plugin
  <https://hapijs.com/tutorials/plugins>`_. It can define new routes and other
  server-side logic.

Hoodie does not create a ``hoodie/`` folder, so you will need to create it:

.. code:: bash

    mkdir hoodie
    mkdir hoodie/{client,server}
    touch hoodie/{client,server}/index.js

Although Hoodie doesn't treat it in any special way, you can use a folder like
``hoodie/lib/`` to store code shared between the client and the server. Client
and server scripts can ``require()`` code from other folders like
``hoodie/lib/``.

The ``hoodie/client/index.js`` file exports a Hoodie plugin. A Hoodie plugin
exports a function that accepts a 'hoodie' object as its sole parameter. This
object contains the interfaces to Hoodie's `client APIs
<http://docs.hood.ie/en/latest/api/client/hoodie.html>`_: 'account', 'store',
'connectionStatus', and 'log'.

You can also attach new methods to the 'hoodie' object, like the 'hello' method in this example ``hoodie/client/index.js`` file:

.. code:: javascript

    module.exports = function (hoodie) {
      hoodie.hello = function (what) {
        return Promise.resolve('Hello, ' + (what || 'world') + '!')
      }
    }


The ``hoodie/server/index.js`` exports a Hapi plugin, like this:

.. code:: javascript

    module.exports.register = function (server, options, next) {
      server.route({
        method: 'GET',
        path: '/hello',
        handler: function (request, reply) {
          reply({ hello: 'world' })
        }
      })
      next()
    }
    
    module.exports.register.attributes = {
      name: '<app name>',
      version: '<app version>'
    }

In this example, the register function is used to add a route to the server at
``/hoodie/<app name>/hello`` that responds with a JSON object like this:
``{ "hello": "world" }``. All of your app's server routes are prefixed with
``/hoodie/<app name>/``.

The 'register' method allows you to modify the server by adding routes and
other server logic. You can read more about how to do that on `Hapi's website
<https://hapijs.com/tutorials/plugins>`_. You can access `Hoodie's server-side
libraries
<http://docs.hood.ie/en/latest/api/index.html#the-hoodie-server-api>`_ via
``server.plugins``.

public/
~~~~~~~

When you open your app in the browser you will see Hoodie’s default page
telling you that your app has no **public/** folder. So let’s create it

.. code:: bash

    mkdir public
    touch public/index.html

Now edit the **public/index.html** file and pass in the following
content.

.. code:: html

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>My Hoodie App</title>
      </head>
      <body>
        <h1>My Hoodie App</h1>

        <script src="/hoodie/client.js"></script>
      </body>
    </html>

You need to stop the server now (**ctrl** + **c**) and start it again.
If you reload your app in your browser, you will now see your HTML file.
