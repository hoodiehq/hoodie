Hoodie API
==========

O Hoodie tem duas APIs

1. Hoodie Client API

   O Hoodie Client API é o que você carrega na sua aplicação web usando uma
   script tag. Ela conecta ao Hoodie Backend.


2. Hoodie Server API

   O Hoodie Server API é usado com o  Hoodie e os route handlers e plugins
   para gerenciar contas, dados e integrar outros dispositivos.

Hoodie Client API
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

-  `The Hoodie Client API <client/hoodie.html>`__, which has
   a couple of useful helpers
-  `The account API <client/hoodie.account.html>`__,
   which lets you do user authentication, such as signing users up, in
   and out
-  `The store API <client/hoodie.store.html>`__,
   which provides means to store and retrieve data for each individial
   user
-  `The connectionStatus API <client/hoodie.connection-status.html>`__,
   which provides helpers for connectivity.
-  `The log API <client/hoodie.log.html>`__, which
   provides a nice API for logging all the things

Hoodie Server API
~~~~~~~~~~~~~~~~~~~~~

O Hoodie Server API está atualmente em progresso. Mas você pode dar uma olhada em `Account Server API <https://github.com/hoodiehq/hoodie-account-server-api>`__
and the `Store Server API <https://github.com/hoodiehq/hoodie-store-server-api>`__
