Hoodie API
==========

Hoodie provides two APIs

1. The Hoodie Client API

   The Hoodie Client API is what you load into your web application using a
   script tag. It connects to your Hoodie Backend's routes

2. The Hoodie Server API

   The Hoodie Server API is used within Hoodie’s route handlers and by plugins
   to manage accounts, data and to securely integrate with 3rd party services.

The Hoodie Client API
~~~~~~~~~~~~~~~~~~~~~

.. toctree::
   :maxdepth: 1
   :hidden:
   :caption: Client

   client/hoodie
   client/hoodie.account
   client/hoodie.store
   client/hoodie.connection-status
   client/hoodie.log

This library, commonly called **Hoodie Client**, is what you'll be
working with on the client side. It consists of:

-  `The Hoodie Client API </api/client/hoodie>`__, which has
   a couple of useful helpers
-  `The account API </api/client/hoodie.account>`__,
   which lets you do user authentication, such as signing users up, in
   and out
-  `The store API </api/client/hoodie.store>`__,
   which provides means to store and retrieve data for each individial
   user
-  `The connectionStatus API </api/client/hoodie.connection-status>`__,
   which provides helpers for connectivity.
-  `The log API </api/client/hoodie.log>`__, which
   provides a nice API for logging all the things

The Hoodie Server API
~~~~~~~~~~~~~~~~~~~~~

The Hoodie Server API is currently work-in-progress. But you can have a look
at the `Account Server API <https://github.com/hoodiehq/hoodie-account-server-api>`__
and the `Store Server API <https://github.com/hoodiehq/hoodie-store-server-api>`__
for a sneak peak.
