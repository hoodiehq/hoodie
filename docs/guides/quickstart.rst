Quickstart
==========

In this guide you’ll learn how to create a demo Hoodie app, learn about the
basic structure of a Hoodie project and its folders, the endpoints and app URLs
and how to include and use the Hoodie library in your project.

|Remix on Glitch|

.. |Remix on Glitch| image:: https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg
   :target: https://glitch.com/edit/#!/remix/hoodie

Prerequisites
~~~~~~~~~~~~~

For all operating systems, you’ll need Node.js installed. You can download Node from
`nodejs.org`_. We recommend the LTS (Long Term Support) version.

Make sure you have version 4 or higher. You can find out with

.. code:: bash

    $ node -v

Create a new Hoodie Backend
~~~~~~~~~~~~~~~~~~~~~~~~~~~

First you need to create a new folder, let’s call it **testapp**

.. code:: bash

    $ mkdir testapp

Change into the ``testapp`` directory.

.. code:: bash

    $ cd testapp

Now we need to create a **package.json** file. For that we can use
`npm`_ which comes with Node by default. It will ask you a few
questions, you can simply press enter to leave the default values.

.. code:: bash

    $ npm init -y

Now we can install **hoodie** using npm

.. code:: bash

    $ npm install hoodie --save

The resulting **package.json** file in the current folder, should look something
like this

.. code:: json

    {
      "name": "testapp",
      "version": "1.0.0",
      "description": "",
      "main": "index.js",
      "scripts": {
        "start": "hoodie",
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "keywords": [],
      "author": "",
      "license": "ISC"
    }

Now you can start Hoodie with

.. code:: bash

    $ npm start

Great, your Hoodie backend started up and is now telling you at which URL you
can access it. By default that is http://127.0.0.1:8080

Congratulations, you just created your first Hoodie Backend :) You can now
load the Hoodie client on any website with

.. code:: html

    <script src="http://127.0.0.1:8080/hoodie/client.js"></script>

You can also create a :code:`public/index.html` file, which will be served
at http://127.0.0.1:8080 after you restart the server. All assets in the public
folder, like images, CSS files or JavaScript files, will be served by your
Hoodie Backend at :code:`http://127.0.0.1:8080/<path/to/your/file.ext>`.

If you just want to try, you can copy https://raw.githubusercontent.com/gr2m/sweet.la/master/public/index.html to  your index.html.  (This code was created to present Hoodie in an event, you can watch it at https://www.youtube.com/watch?v=TSDyxtVbbME&t=1272s)
Open the Console and try:

.. code:: bash

    hoodie


Also try:

.. code:: bash

    hoodie.account.signUp({username: 'foo', password: 'secret'})


Now, test using it offline and back online.  You can also open a second browser (incognito) and see the changes being replicated.



Note for npm v2
---------------

Because of how npm v2 installs sub dependencies, the hoodie client cannot be
bundled. As a workaround, just install ``pouchdb-browser`` and ``@hoodie/client``
as a dependency of your hoodie app

.. code:: bash

    $ npm install --save pouchdb-browser @hoodie/client

What’s next?
~~~~~~~~~~~~

Our `Hoodie Tracker App`_ is a great place to see how to use a Hoodie backend.
It’s an intentionally simple and well commented application built with only
HTML, JavaScript and CSS, without using any library or framework. You can see it
running at https://hoodie-app-tracker.now.sh/

Having Trouble?
~~~~~~~~~~~~~~~

Sorry it didn’t go smoothly for you. Come `chat with us`_
or `ask a question on StackOverflow`_

.. _nodejs.org: https://nodejs.org/
.. _npm: https://www.npmjs.com/
.. _chat with us: http://hood.ie/chat/
.. _ask a question on StackOverflow: https://stackoverflow.com/questions/ask?tags=hoodie
.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
