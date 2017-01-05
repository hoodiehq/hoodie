Deployment
==========

Docker
~~~~~~

We continuously deploy our `Hoodie Tracker App`_ using Docker. You can read
about our continuous
deployment set at `hoodie-app-tracker/deployment.md`_.

.. _Hoodie Tracker App: https://github.com/hoodiehq/hoodie-app-tracker
.. _hoodie-app-tracker/deployment.md: https://github.com/hoodiehq/hoodie-app-tracker/blob/maste/deployment.md

Now
~~~

`now`_ is a great way to quickly deploy Node.js applications.
Unfortunately, now is a read-only file system, so you must either run
your app in memory or set an external CouchDB URL.

Add this script to your package.json and you are good to go:

::

      "now-start": "hoodie --inMemory",

.. _now: https://zeit.co/now
