Glossary
========

CouchDB
~~~~~~~

`CouchDB`_ is a non-relational, document-based database that replicates,
which means it’s really good at syncing data between multiple instances
of itself. All data is stored as JSON, all indices (queries) are written
in JavaScript, and it uses regular HTTP as its API.

PouchDB
~~~~~~~

`PouchDB`_ is an in-browser datastore inspired by CouchDB. It enables
applications to store data locally while offline, then synchronize it
with CouchDB.

hapi
~~~~

`hapi`_ is a rich framework for building applications and services,
enabling developers to focus on writing reusable application logic and
not waste time with infrastructure logic. You can `load hoodie as a hapi
plugin`_ to use it in your existing hapi application.

Users
~~~~~

Hoodie isn’t a CMS, but a backend for web apps, and as such, it is very
much centered around users. All of the offline and sync features are
specific to each individual user’s data, and each user’s data is
encapsulated from that of all others by default. This allows Hoodie to
easily know what to sync between a user’s clients and the server: simply
all of the user’s private data.

Private User Store
~~~~~~~~~~~~~~~~~~

Every user signed up with your Hoodie app has their private little database.
Anything you do in the **hoodie.store** methods stores data in here.

.. _CouchDB: http://couchdb.apache.org/
.. _PouchDB: https://pouchdb.com/
.. _hapi: https://hapijs.com/
.. _load hoodie as a hapi plugin: https://github.com/hoodiehq/hoodie#hapi-plugin
