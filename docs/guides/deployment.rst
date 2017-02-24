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

Hoodie API
~~~~~~~~~~~

Hoodie provides two APIs

1.The Hoodie Client API

The Hoodie Client API is what you load into your web application using a script tag. It connects to your Hoodie Backend’s routes

2.The Hoodie Server API

The Hoodie Server API is used within Hoodie’s route handlers and by plugins to manage accounts, data and to securely integrate with 3rd party services.

The Hoodie Client API
~~~~~~~~~~~~~~~~~~~~~

This library, commonly called Hoodie Client, is what you’ll be working with on the client side. It consists of:

- `The_Hoodie_Client_API__` , which has a couple of useful helpers

- `The account API`_ , which lets you do user authentication, such as signing users up, in and out

- `The store API`_ , which provides means to store and retrieve data for each individial user

- `The connectionStatus API`_ , which provides helpers for connectivity

- `The log API`_ , which provides a nice API for logging all the things

.. TheHoodie Client API : http://docs.hood.ie/api/client/hoodie

.. The account API : http://docs.hood.ie/api/client/hoodie.account

.. The store API : http://docs.hood.ie/api/client/hoodie.store

.. The connectionStatus API : http://docs.hood.ie/api/client/hoodie.connection-status

.. The log API : http://docs.hood.ie/api/client/hoodie.log

The Hoodie Server API
~~~~~~~~~~~~~~~~~~~~~

The Hoodie Server API is currently work-in-progress. But you can have a look at the `Account Server API`_ and the `Store Server API`_ for a sneak peak.

.. Account Server API : https://github.com/hoodiehq/hoodie-account-server-api

.. Store Server API : https://github.com/hoodiehq/hoodie-store-server-api


hoodie
~~~~~~

Introduction
~~~~~~~~~~~~

This document describes the functionality of the hoodie base object. It provides a number of helper methods dealing with event handling and connectivity, as well as a unique id generator and a means to set the endpoint which Hoodie communicates with.

Initialisation
~~~~~~~~~~~~~~

The Hoodie Client persists state in the browser, like the current user’s id, session or the connection status to the backend. On page load, Hoodie has to load this state from the local store before you can use its APIs. You can use the Promise returned by :code:`hoodie.ready` to wait until all APIs are fully initialised
::

hoodie.ready.then(function () {
  // all hoodie APIs are ready now
})

This is work in progress
~~~~~~~~~~~~~~~~~~~~~~~~

Please help us make this awesome <3

For the time being, check out `hoodie-client's README`_ . {#underline}

.. hoodie-client’s README : https://github.com/hoodiehq/hoodie-client

hoodie.account
~~~~~~~~~~~~~~

The account object in the client-side Hoodie API covers all user and authentication-related operations, and enables you to do previously complex operations, such as signing up a new user, with only a few lines of frontend code. Since `data in Hoodie is generally bound to a user`_ , it makes sense to familiarise yourself with account before you move on to `store`_.

.. data in Hoodie is generally bound to a user : http://docs.hood.ie/camp/hoodieverse/glossary.html#private-user-store

.. store : http://docs.hood.ie/camp/techdocs/api/client/hoodie.store.html

This is work in progress
~~~~~~~~~~~~~~~~~~~~~~~~

Please help us make this awesome <3

For the time being, check out `hoodie-account-client's README`_.

.. hoodie-account-client’s README : https://github.com/hoodiehq/hoodie-account-client

hoodie.store
~~~~~~~~~~~~

If you want to do anything with data in Hoodie, this is where it happens.

This is work in progress
~~~~~~~~~~~~~~~~~~~~~~~~

Please help us make this awesome <3

For the time being, check out `hoodie-store-client'S_README_`.

.. hoodie-store-client’s README : https://github.com/hoodiehq/hoodie-store-client

hoodie.connectionStatus
~~~~~~~~~~~~~~~~~~~~~~~

This is work in progress
~~~~~~~~~~~~~~~~~~~~~~~~

Please help us make this awesome <3

For the time being, check out `hoodie-connection-status'S README`_.

.. hoodie-connection-status’s README : https://github.com/hoodiehq/hoodie-connection-status

hoodie.log
~~~~~~~~~~

This is work in progress
~~~~~~~~~~~~~~~~~~~~~~~~

Please help us make this awesome <3

For the time being, check out `hoodie-log'S_README`_.

.. hoodie-log’s README : https://github.com/hoodiehq/hoodie-log

Hoodie’s Concepts
~~~~~~~~~~~~~~~~~

Hoodie was designed around a few core beliefs and concepts, and they explain a lot if the choices made in the code and the functionality. They are:

- `Dreamcode`_
 
- `noBackend`_

- `Offline First`_

.. Dreamcode : http://docs.hood.ie/en/latest/about/hoodie-concepts.html#dreamcode

.. noBackend : http://docs.hood.ie/en/latest/about/hoodie-concepts.html#nobackend

.. Offline First : http://docs.hood.ie/en/latest/about/hoodie-concepts.html#offline-first

Dreamcode
~~~~~~~~~

While designing Hoodie’s API, we realised that we wanted to do more than simply expose some server code to the frontend. We wanted to reduce complexity, not move it around. And to make something simple and intuitive, you can’t start with the tech stack, you have to start with the humans that are going to use it. What would their dream API look like? Dreamcode is essentially user-centered design for APIs.

To put it bluntly: Hoodie’s API is optimized for being awesome. For being intuitive and accessible. And it’s optimized for making the lives of frontend developers as good as possible. It’s also an API first: it’s a promise - everything else can change or is replaceable. The API is all that matters.

Forget all the constraints of today’s browsers. Then write down the code of your dreams for all the tasks you need to build your app. The implementation behind the API doesn’t matter, it can be simple or tough as nails, but crucially: the users shouldn’t have to care. This is dreamcode.

Everything is hard until someone makes it easy. We’re making web app development easy.

Here’s some further information and links to Dreamcode examples.

noBackend
~~~~~~~~~

Servers are difficult. Databases are difficult. The interplay between client and server is difficult, there are many moving parts, there are many entertaining mistakes to make, and the barrier to entry for web app development is, in our mind, needlessly high. You shouldn’t have to be a full stack developer to build a functioning app prototype, or code a small tool for yourself or your team, or launch a simple MVP.

People have been building web apps for quite a while now, and their basic operations (sign up, sign in, sign out, store and retrieve data, etc.) must have been written a million separate times by now. These things really shouldn’t be difficult anymore. So we’re proposing Hoodie as a noBackend solution. Yes, a backend does exist, but it doesn’t have to exist in your head. You don’t have to plan it or set it up. You simply don’t have to worry about it for those basic operations, you can do all of them with Hoodie’s frontend API. Of yourse, we let you dig as deep as you want, but for the start, you don’t have to.

noBackend gives you time to work on the hard problems, the parts of the app that are justifiably difficult and non-abstractable, like the interface, the user experience, the things that make your product what it is.

With Hoodie, you scaffold out your app with
::

$ hoodie new best-app-ever

and you’re good to go. Sign up users, store data… it’s all right there, immediately. It’s a backend in a box, empowering frontend developers to build entire apps without thinking about the backend at all. Check out some example Hoodie apps if you’d like to see some code.

More information about noBackend
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See nobackend.org, Examples for noBackend solutions and @nobackend on Twitter.

Offline First
~~~~~~~~~~~~~

We make websites and apps for the web. The whole point is to be online, right? We’re online when we build these things, and we generally assume our users to be in a state of permanent connectivity. That state, however, is a myth, and that assumption causes all sorts of problems.

With the stellar rise of mobile computing, we can no longer assume anything about our users’ connections. Just as we all had to learn to accept that screens now come in all shapes and sizes, we’ll have to learn that connections can be present or absent, fast or slow, steady or intermittent, free or expensive… We reacted to the challenge of unknowable screen sizes with Responsive Webdesign and Mobile First, and we will react to the challenge of unknowable connections with Offline First.

Offline First means: build your apps without the assumption of permanent connectivity. Cache data and apps locally. Build interfaces that accomodate the offline state elegantly. Design user interactions that will not break if their train goes into a tunnel. Don’t freak out your users with network error messages or frustrate them with inaccessible data. Offline First apps are faster, more robust, more pleasant to use, and ultimately: more useful.

More information about Offline First
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See offlinefirst.org, on GitHub and discussions and research

So now you know what motivates us
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We hope this motivated you too! So let’s continue to the system requirements for Hoodie.

How Hoodie Works
~~~~~~~~~~~~~~~~

Hoodie has several components that work together in a somewhat atypical way to deliver our promise of simplicity, out-of-the-box syncing, and offline capability.

Everything starts in the frontend, with your app. This is your user interface, your client side business logic, etc.

![alt tag](http://docs.hood.ie/en/latest/_images/1.jpg)

The app code only talks to the Hoodie frontend API, never directly to the server-side code, the database, or even the in-browser storage.

![alt tag](http://docs.hood.ie/en/latest/_images/2.jpg)

Hoodie uses PouchDB for storing data locally, which uses IndexedDb or WebSQL, whatever is available. Hoodie saves all data here first, before doing anything else. So if you’re offline, your data is safely stored locally.

![alt tag](http://docs.hood.ie/en/latest/_images/3.jpg)

This, by itself, is already enough for an app. But if you want to save your data remotely or send an email, for example, you’ll need a bit more.

Hoodie relies on CouchDB, the database that replicates. We use it to sync data back and forth between the server and the clients, which is something that CouchDB happens to be really good at.

![alt tag](http://docs.hood.ie/en/latest/_images/4.jpg)

A small aside: In CouchDB, each user has their own private database which only they can access, so all user data is private by default. It can be shared to the public if the user decides to do so, but it can’t happen by accident. This is why we’ll often mention sharing and global data as a separate feature.

Behind the database, we have the actual server code in the form of a small node.js core with various plugins running alongside it. These then act upon the data in the CouchDB, which then replicates the changes back to the clients.

![alt tag](http://docs.hood.ie/en/latest/_images/5.jpg)

So Hoodie does client ↔ database ↔ server instead of the traditional client ↔ server ↔ database, and this is where many of its superpowers come from.

The clever bit is indicated by the dotted line in the middle; the connection between clients and server can be severed at any time without breaking the system. Frontend and backend never talk directly to each other. They only leave each other messages and tasks. It’s all very loosely-coupled and event-based, and designed for eventual consistency.



Architecture
~~~~~~~~~~~~

After `installing hoodie`_,:code:`npm start` will run `cli/index.js`_ which reads out the `configuration`_ from all the different places using the `rc`_ package, then passes it as options to :code:`server/index.js`, the Hoodie core `hapi plugin`_.

.. installing hoodie : http://docs.hood.ie/en/latest/guides/quickstart

.. cli/index.js : https://github.com/hoodiehq/hoodie/blob/master/cli/index.js

.. configuration : http://docs.hood.ie/en/latest/guides/configuration

.. rc : https://www.npmjs.com/package/rc

.. hapi plugin : https://hapijs.com/

In `server/index.js`_, the passed options are merged with defaults and parsed into configuration for the Hapi server. It passes the configuration on to`hoodie-server <`https://github.com/hoodiehq/hoodie-server#readme`>`__, which combines the core server modules. It also bundles the Hoodie client on first request to :code:`/hoodie/client.js` and passes in the configuration for the client. It also makes the app’s :code:`public` folder accessible at the :code:`/` root path, and Hoodie’s Core UIs at :code:`/hoodie/admin`, :code:`/hoodie/account` and :code:`/hoodie/store`.

.. server/index.js : https://github.com/hoodiehq/hoodie/blob/master/server/index.js

.. https://github.com/hoodiehq/hoodie-server#readme : https://github.com/hoodiehq/hoodie-server#readme

Hoodie uses `CouchDB`_ for data persistence. If :code:`options.dbUrl` is not set, it falls back to `PouchDB`_.

.. CouchDB : https://couchdb.apache.org/

.. PouchDB : https://pouchdb.com/

Once all configuration is taken care of, the internal plugins are initialised (see `server/plugins/index.js`_). We define simple Hapi plugins for `logging`_ and for `serving the app's public assets and the Hoodie client`_.

.. server/plugins/index.js : https://github.com/hoodiehq/hoodie/blob/master/server/plugins/index.js

.. logging : https://github.com/hoodiehq/hoodie/blob/master/server/plugins/logger.js

.. serving the app's public assets and the Hoodie client : https://github.com/hoodiehq/hoodie/blob/master/server/plugins/public.js

Once everything is setup, the server is then started at the end of `cli/start.js`_ and the URL where hoodie is running is logged to the terminal.

.. cli/start.js : https://github.com/hoodiehq/hoodie/blob/master/cli/start.js

Modules
~~~~~~~

Hoodie is a server built on top of `hapi`_ with frontend APIs for account and store related tasks. It is split up in many small modules with the goal to lower the barrier to new code contributors and to share maintenance responsibilities.

.. hapi : https://hapijs.com/

1.server `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-server

.. coverage:100% : https://coveralls.io/github/hoodiehq/hoodie-server

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-server 

Hoodie’s core server logic as hapi plugin. It integrates Hoodie’s server core modules: `account-server`_, `store-server`_

.. account-server : https://github.com/hoodiehq/hoodie-account-server

.. store-server : https://github.com/hoodiehq/hoodie-store-server

1.account-server `build:passing`_ `coverage:95%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-account-server

.. coverage:95% : https://coveralls.io/github/hoodiehq/hoodie-account-server

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-account-server

`Hapi`_ plugin that implements the `Account JSON API`_ routes and exposes a corresponding API at :cose:`server.plugins.account.api.*`.

.. Hapi : https://hapijs.com/

.. Account JSON API : http://docs.accountjsonapi.apiary.io/#

2.store-server `build:passing`_ `coverage:91%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-store-server

.. coverage:91% : https://coveralls.io/github/hoodiehq/hoodie-store-server

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-store-server

`Hapi`_ plugin that implements `CouchDB's Document API`_. Compatible with `CouchDB`_ and `PouchDB`_ for persistence.

.. Hapi : https://hapijs.com/

.. CouchDB's Document API : https://wiki.apache.org/couchdb/HTTP_Document_API

.. CouchDB : https://couchdb.apache.org/

.. PouchDB : https://pouchdb.com/

2.client `build:passing`_ `coverage:92%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-client

.. coverage:92% : https://coveralls.io/github/hoodiehq/hoodie-client

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-client

Hoodie’s front-end client for the browser. It integrates Hoodie’s client core modules: `account-client`_, `store-client`_, `connection-status`_ and `log`_

.. account-client :  https://github.com/hoodiehq/hoodie-account-client

.. store-client : https://github.com/hoodiehq/hoodie-store-client

.. connection-status : https://github.com/hoodiehq/hoodie-connection-status

.. log : https://github.com/hoodiehq/hoodie-log

1.account-client `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-account-client

.. coverage:100% : https://coveralls.io/r/hoodiehq/hoodie-account-client?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-account-client

Client for the `Account JSON API`_. It persists session information on the client and provides front-end friendly APIs for things like creating a user account, confirming, resetting a password, changing profile information, or closing the account.

.. Account JSON API : http://docs.accountjsonapi.apiary.io/

2.store-client `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-store-client

.. coverage:100% : https://coveralls.io/r/hoodiehq/hoodie-store-client?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-store-client

Store client for data persistence and offline sync. It combines `pouchdb-hoodie-api`_ and `pouchdb-hoodie-sync`_.

.. pouchdb-hoodie-api : https://github.com/hoodiehq/pouchdb-hoodie-api

.. pouchdb-hoodie-sync : https://github.com/hoodiehq/pouchdb-hoodie-sync

1.pouchdb-hoodie-api `build:failing`_ `coverage:99%`_ `dependencies:up to date`_

.. build:failing : https://travis-ci.org/hoodiehq/pouchdb-hoodie-api

.. coverage:99% : https://coveralls.io/r/hoodiehq/pouchdb-hoodie-api?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/pouchdb-hoodie-api

`PouchDB`_ plugin that provides simple methods to add, find, update and remove data.

.. PouchDB : https://pouchdb.com/

2.pouchdb-hoodie-sync `build:passing`_ `coverage:97%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/pouchdb-hoodie-sync

.. coverage:97% : https://coveralls.io/r/hoodiehq/pouchdb-hoodie-sync?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/pouchdb-hoodie-sync

`PouchDB`_ plugin that provides simple methods to keep two databases in sync.

.. PouchDB : https://pouchdb.com/

3.connection-status `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-connection-status

.. coverage:100% : https://coveralls.io/r/hoodiehq/hoodie-connection-status?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-connection-status

Browser library to monitor a connection status. It emits :code:`disconnect` & :code:`reconnect` events if the request status changes and persists its status on the client.

4.log `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-log

.. coverage:100% : https://coveralls.io/r/hoodiehq/hoodie-log?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-log

JavaScript library for logging to the browser console. If available, it takes advantage of `CSS-based styling of console log outputs`_.

.. CSS-based styling of console log outputs : https://developer.mozilla.org/en-US/docs/Web/API/Console#Styling_console_output

5.admin `build:passing`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-admin

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-admin

Hoodie’s built-in Admin Dashboard, built with `Ember.js`_

.. Ember.js : http://emberjs.com/

1.admin-client `build:passing`_ `coverage:100%`_ `dependencies:up to date`_

.. build:passing : https://travis-ci.org/hoodiehq/hoodie-admin-client

.. coverage:100% : https://coveralls.io/r/hoodiehq/hoodie-admin-client?branch=master

.. dependencies:up to date : https://david-dm.org/hoodiehq/hoodie-account-client

Hoodie’s front-end admin client for the browser. Used in the Admin Dashboard, but can also be used standalone for custom admin dashboard.


Files & Folders
~~~~~~~~~~~~~~~

package.json
~~~~~~~~~~~~
TO BE DONE: Describe README file

README.md
~~~~~~~~~
TO BE DONE: Describe package.json file

.hoodie/
~~~~~~~~

TO BE DONE: Describe .hoodie/ folder (caching of bundled client, data stored by PouchDB, ...)

hoodie/
~~~~~~~

TO BE DONE: Describe hoodie/ folder, extending app with hoodie/server/indexjs and hoodie/client/index.js.

public/
~~~~~~~

When you open your app in the browser you will see Hoodie’s default page telling you that your app has no public/ folder. So let’s create it

<pre><code>mkdir public
touch public/index.html
</code></pre>

Now edit the public/index.html file and pass in the following content.

<pre><code><!DOCTYPE html>
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
</code></pre>

You need to stop the server now (ctrl + c) and start it again. If you reload your app in your browser, you will now see your HTML file.

The only line interesting for us is t

Requirements
~~~~~~~~~~~~

Before you start working with Hoodie, here’s what you need to know regarding your development/server environment and the browsers Hoodie will run in.

System Requirements for Hoodie Server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-Mac OSX

-Windows 7 and up

-Linux (Ubuntu, Fedora 19+)

Browser Compatibilities (all latest stable)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-Firefox (29+)

-Chrome (34+)

-Desktop Safari (7+)

-Internet Explorer 10+

-Opera (21+)

-Android 4.3+

-iOS Safari (7.1+)

Important: This list is currently based on `PouchDB_'s requirements`_ , since Hoodie is using PouchDB for its in-browser storage.

.. PouchDB_'s requirements : https://pouchdb.com/learn.html

Glossary
~~~~~~~~

CouchDB
~~~~~~~

`CouchDB`_ is a non-relational, document-based database that replicates, which means it’s really good at syncing data between multiple instances of itself. All data is stored as JSON, all indices (queries) are written in JavaScript, and it uses regular HTTP as its API.

.. CouchDB : http://couchdb.apache.org/

PouchDB
~~~~~~~

`PouchDB`_ is an in-browser datastore inspired by CouchDB. It enables applications to store data locally while offline, then synchronize it with CouchDB.

.. PouchDB : https://pouchdb.com/

hapi
~~~~

`hapi`_ is a rich framework for building applications and services, enabling developers to focus on writing reusable application logic and not waste time with infrastructure logic. You can `load hoodie as a hapi plugin`_ to use it in your existing hapi application.

.. hapi : https://hapijs.com/

.. load hoodie as a hapi plugin : https://github.com/hoodiehq/hoodie#hapi-plugin

Users
~~~~~

Hoodie isn’t a CMS, but a backend for web apps, and as such, it is very much centered around users. All of the offline and sync features are specific to each individual user’s data, and each user’s data is encapsulated from that of all others by default. This allows Hoodie to easily know what to sync between a user’s clients and the server: simply all of the user’s private data.

Private User Store
~~~~~~~~~~~~~~~~~~

Every user signed up with your Hoodie app has their private little database. Anything you do in the hoodie.store methods stores data in here.













