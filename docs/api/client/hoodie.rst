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
id, session or the connection status to the backend. On page load,
Hoodie has to load this state from the local store before you can use
its APIs. You can use the Promise returned by ``hoodie.ready`` to wait
until all APIs are fully initialised

.. code:: js

    hoodie.ready.then(function () {
      // all hoodie APIs are ready now
    })

This is work in progress
------------------------

Please help us make this awesome <3

For the time being, check out `hoodie-client’s
README <https://github.com/hoodiehq/hoodie-client>`__.
