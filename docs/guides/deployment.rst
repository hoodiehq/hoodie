Deployment
==========

One line deploy
~~~~~~~~~~~~~~~

After you’ve built your Hoodie app you probably want to put it online. You can choose to deploy your app as read-only or deploy the backend couchdb database as well. This `video`_ and the text below descibes how to deploy your app using one line of code. Alternatively, you can deploy your app using Docker, please refer to the Docker section. 

.. _video: https://youtu.be/29Uclxq_1Vw
Deploying to Now
~~~~~~~~~~~~~~~~
.. _command line tool: https://github.com/zeit/now-cli
.. _Hoodie Tracker demo: https://github.com/hoodiehq/hoodie-app-tracker 

`Now`_ allows you to deploy a Node application with its `command line tool`_. It’s 100% free for Open Source projects. You can deploy an app from your computer or right from a GitHub repository. For example, to deploy our `Hoodie Tracker demo`_ app all you have to do is to run this command:
::

$ now hoodiehq/hoodie-app-tracker --npm -e NODE_ENV=production -e hoodie_inMemory=true

To decribe this further:

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
.. _Cloudant: https://cloudant.com/_

`Cloudant`_ is a DBaaS (database-as-a-service). It provides most of CouchDB’s APIs and can be used as Hoodie’s database backend. Signing up for a free account only takes a moment. After sign up, you need to slightly adjust the now deployment command above.
::

$ now hoodiehq/hoodie-app-tracker -e NODE_ENV=production -e hoodie_inMemory=true -e hoodie_dbUrl=https://username:password@username.cloudant.com/

The :code:`hoodie_inMemory` environment variable makes sure that Hoodie does not try to write any files like the bundled /hoodie/client.js library. The :code:`hoodie_dbUrl` environment variable sets the address and credentials to your CouchDB. Replace username and password to whatever you signed up with.


Test and set an alias
~~~~~~~~~~~~~~~~~~~~~~

When you deploy with now you will receive a random subdomain where you can access your application. It looks something like https://hoodie-app-tracker-randomxyz.now.sh/ and was already copied to your clipboard during the deployment. Open the URL in your browser to give it a try. Once everything is good, you can change the subdomain to your preference by running:
::

$ now alias set hoodie-app-tracker-randomxyz my-tracker-app

That will make your deployed Hoodie Tracker app accessible at https://my-tracker-app.now.sh. For example, here is the app that I deployed myself: https://hoodie-app-tracker.now.sh/

Docker
~~~~~~

We continuously deploy our `Hoodie Tracker App`_ using Docker. You can read
about our continuous
deployment set at `hoodie-app-tracker/deployment.md`_.

.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
.. _hoodie-app-tracker/deployment.md: https://github.com/hoodiehq/hoodie-app-tracker/blob/master/deployment.md

