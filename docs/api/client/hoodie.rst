hoodie
======


Introduction
------------

This document describes the functionality of the hoodie base object. It
provides a number of helper methods dealing with event handling and
connectivity, as well as a unique id generator and a means to set the
endpoint which Hoodie communicates with.

Initialisation
--------------

The Hoodie Client persists state in the browser, like the current user’s
id, session or the connection status to the backend.

.. code:: js

    hoodie.account.get('session').then(function (session) {
      if (session) {
        // user is signed in
      } else {
        // user is signed out
      }
    })

This is work in progress
------------------------

Please help us make this awesome <3

For the time being, check out `hoodie-client’s
README <https://github.com/hoodiehq/hoodie-client>`__.
