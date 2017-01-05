Files & Folders
===============

package.json
~~~~~~~~~~~~

TO BE DONE: Describe package.json file

README.md
~~~~~~~~~

TO BE DONE: Describe README file

.hoodie/
~~~~~~~~

TO BE DONE: Describe .hoodie/ folder (caching of bundled client, data stored by
PouchDB, ...)

hoodie/
~~~~~~~

TO BE DONE: Describe hoodie/ folder, extending app with hoodie/server/indexjs
and hoodie/client/index.js.

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

The only line interesting for us is t
