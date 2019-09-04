Deployment
==========

One line deploy
~~~~~~~~~~~~~~~

After you’ve built your Hoodie app you probably want to put it online. You can choose to deploy your app as read-only or deploy the backend couchdb database as well. This `video`_ and the text below describes how to deploy your app using one line of code. Alternatively, you can deploy your app using Docker, please refer to the Docker section.

.. _video: https://youtu.be/29Uclxq_1Vw

Deploying to Now
~~~~~~~~~~~~~~~~
.. _command line tool: https://github.com/zeit/now-cli
.. _Hoodie Tracker demo: https://github.com/hoodiehq/hoodie-app-tracker

`Now`_ allows you to deploy a Node application with its `command line tool`_. It’s 100% free for Open Source projects. You can deploy an app from your computer or right from a GitHub repository. For example, to deploy our `Hoodie Tracker demo`_ app all you have to do is to run this command:

.. code:: bash

    $ now hoodiehq/hoodie-app-tracker --npm -e NODE_ENV=production -e hoodie_inMemory=true

To describe this further:

- :code:`hoodiehq/hoodie-app-tracker` is the GitHub repository slug.

- :code:`--npm` tells now to deploy using npm as there is also Dockerfile in the repository.

- :code:`-e NODE_ENV=production` sets the NODE_ENV environment variable to production, which makes the deployment faster as no devDependencies will be installed.

- :code:`-e hoodie_inMemory=true` makes the Hoodie app run in-memory mode, meaning that no data is persisted and no files are written. This is important because now is a read-only file system. That means that all user accounts and data will be lost on the next deployment, but it is great for for a quick test or demo of your application.

Alternatively, add this script to your package.json and you are good to go:

::

    "now-start": "hoodie --inMemory",

.. _Now: https://zeit.co/now

Store Data With Cloudant
~~~~~~~~~~~~~~~~~~~~~~~~
.. _Cloudant: https://cloudant.com/

`Cloudant`_ is a DBaaS (database-as-a-service). It provides most of CouchDB’s APIs and can be used as Hoodie’s database backend. Signing up for a free account only takes a moment. After sign up, you need to slightly adjust the now deployment command above.

.. code:: bash

    $ now hoodiehq/hoodie-app-tracker -e NODE_ENV=production -e hoodie_inMemory=true -e hoodie_dbUrl=https://username:password@username.cloudant.com/

The :code:`hoodie_inMemory` environment variable makes sure that Hoodie does not try to write any files like the bundled /hoodie/client.js library. The :code:`hoodie_dbUrl` environment variable sets the address and credentials to your CouchDB. Replace username and password to whatever you signed up with.


Test and set an alias
~~~~~~~~~~~~~~~~~~~~~~

When you deploy with now you will receive a random subdomain where you can access your application. It looks something like https://hoodie-app-tracker-randomxyz.now.sh/ and was already copied to your clipboard during the deployment. Open the URL in your browser to give it a try. Once everything is good, you can change the subdomain to your preference by running:

.. code:: bash

    $ now alias set hoodie-app-tracker-randomxyz my-tracker-app

That will make your deployed Hoodie Tracker app accessible at https://my-tracker-app.now.sh. For example, here is the app that I deployed myself: https://hoodie-app-tracker.now.sh/

Docker
~~~~~~

We continuously deploy our `Hoodie Tracker App`_ using Docker. You can read
about our continuous
deployment set at `hoodie-app-tracker/deployment.md`_.

.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
.. _hoodie-app-tracker/deployment.md: https://github.com/hoodiehq/hoodie-app-tracker/blob/master/deployment.md


Deployment in linux
~~~~~~~~~~~~~~~~~~~

This guide is for Linux only at this point.
I have tried to deploy `Hoodie-App-Tracker <https://github.com/hoodiehq/hoodie-app-tracker>`__ as an example:

install dependencies
--------------------

1. `Install CouchDB <http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/>`__ 1.2.0 or later, 1.4.0 or later recommended for performance.
2. `Install NodeJS <https://nodejs.org/en/>`__ LTS version or later. This includes npm.
3. `Install git <https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-16-04>`__.

CouchDB
-------

We assume you set up CouchDB with your package manager or manually following the
`installation procedure`_.

In order to test if CouchDB is running fine or not, we can simply run the following
command which will retrieve the information through curl.

.. code:: bash

    $ curl localhost:5984

If you are already using CouchDB for other things, we recommend starting a second
instance of CouchDB that is completely separate from your original one. See below
for instructions.

In this guide, we assume that your CouchDB is available at `port 5984`_.

Create a CouchDB admin user called **admin** with a strong password of your choice
by clicking on the *Fix this* at `Apache CouchDB-Futon:Overview`_ link in the
lower right corner. Use **admin** as username and keep your password in mind.

Next we have to change CouchDB’s default configuration on a few points. The easiest thing is to go to and change the following fields (double click a value to enter the editing mode):

::

   couchdb -> delayed_commits: false
   couchdb -> max_dbs_open: 1024

.. _installation procedure: http://linoxide.com/linux-how-to/install-couchdb-futon-ubuntu-1604/
.. _port 5984: http://127.0.0.1:5984/
.. _Apache CouchDB-Futon:Overview: http://127.0.0.1:5984/_utils/

System
------

Add this to  :code:`/etc/security/limits.conf`:

::

    hoodie    soft    nofile    768
    hoodie    hard    nofile    1024

Hoodie
------

Create a new system user:

.. code:: bash

    $ sudo useradd --system \
        -m \
        --home /home/hoodie \
        --shell /bin/bash \
        --no-user-group \
        -c "Hoodie Administrator" hoodie


This will create a new user and its home directory /home/hoodie.
But unless you have a password, you can not be a user. To set a password run:

.. code:: bash

    $ sudo passwd hoodie

Give a password of your choice.

**cd** in to that directory.

To switch to **hoodie** user, run:

.. code:: bash

    $ sudo su hoodie

As user Hoodie, install your application:

.. code:: bash

    $ git clone <repo url>

make sure package.json has a valid `name` property.

**cd** into the directory.Run :

.. code:: bash

    $ cd <repo name>

Now run:

.. code:: bash

    $ npm install

To run Hoodie as the root:

.. code:: bash

    $ sudo su hoodie

To launch Hoodie now, as root :

.. code:: bash

    $ npm start -- --dbUrl=http://admin:yourpassword@localhost:5984/

Replace :code:`yourpassword` with the password you choose when you created the
admin user above.

That's it. The app should be running by now.
