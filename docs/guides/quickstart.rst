Quickstart
==========

In this guide you’ll learn how to create a demo Hoodie app, learn about the
basic structure of a Hoodie project and its folders, the endpoints and app URLs
and how to include and use the Hoodie library in your project.

Prerequisites
~~~~~~~~~~~~~

For all OS, you’ll need Node.js installed. You can download Node from
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

    $ npm init

Now we can install **hoodie** using npm

.. code:: bash

    $ npm install hoodie --save

The resulting **package.json** file in the current folder, should look something
like this

.. code:: json

    {
      "name": "funky",
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

What’s next?
~~~~~~~~~~~~

Our `Hoodie Tracker App`_ is a great place to see how to use a Hoodie backend.
It’s an intentionally simple and well commented application built with only
HTML, JavaScript and CSS, without using any library or framework. You can see it
running at https://tracker.hood.ie/

Having Trouble?
~~~~~~~~~~~~~~~

Sorry it didn’t go smoothly for you. Come `chat with us`_
or `ask a question on StackOverflow`_

.. _nodejs.org: https://nodejs.org/
.. _npm: https://www.npmjs.com/
.. _chat with us: http://hood.ie/chat/
.. _ask a question on StackOverflow: https://stackoverflow.com/questions/ask?tags=hoodie
.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
