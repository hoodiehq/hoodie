Files & Folders
===============

package.json
~~~~~~~~~~~~

Contains a list of javascript addon `packages`_ hosted on `npm`_. Hoodie includes a few addon packages but you can add more to the list if required. Addons provide additional features which you can use in your app. The npm website works as an addon package manager. It keeps track of specific versions of packages so your app won't break if a new version of an addon is released.

.. _packages: https://docs.npmjs.com/files/package.json
.. _npm: https://www.npmjs.com/

README.md
~~~~~~~~~

The README file provides `guidance`_ about your app's code for new users or contributors. It's the place to describe what your app does and the motivation behind it. If you choose to host your code online using websites such as `gitlab`_ or `github`_, the README file is displayed prominently on the project page. The file is saved in `markdown`_ format. This allows you to write in plain text or use the markdown language to add formatting such as hyperlinks and or headings. 

.. _github: https://github.com
.. _gitlab: https://gitlab.com
.. _markdown: https://en.wikipedia.org/wiki/Markdown
.. _guidance: https://gist.github.com/indexzero/1363524

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
