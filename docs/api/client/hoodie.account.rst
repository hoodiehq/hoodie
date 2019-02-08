hoodie.account
==============

The account object in the client-side Hoodie API covers all user and
authentication-related operations, and enables you to do previously
complex operations, such as signing up a new user, with only a few lines
of frontend code. Since `data in Hoodie is generally bound to a
user </camp/hoodieverse/glossary.html#private-user-store>`__, it makes
sense to familiarise yourself with **account** before you move on to
`store </camp/techdocs/api/client/hoodie.store.html>`__.

``hoodie-account-client`` is a JavaScript client for the
`Account JSON API <http://docs.accountjsonapi.apiary.io/>`_.
It persists session information in localStorage (or your own store API) and
provides front-end friendly APIs for the authentication-related operations as
mentioned above.

Example
-------

.. code:: js

    hoodie.account.get('session').then(function (sessionProperties) {
      if (!sessionProperties) {
        return redirectToHome()
      }

      renderWelcome(sessionProperties)
    }).catch(redirectToHome)

    hoodie.account.on('signout', redirectToHome)

hoodie.account.validate
-----------------------

Calls the function passed into the Constructor. Returns a Promise that resolves to ``true`` by default

.. code:: js

    hoodie.account.validate(options)

+----------------------+-------------+-------------+
| Argument             | Type        | Required    |
+======================+=============+=============+
| ``options.username`` | String      | No          |
+----------------------+-------------+-------------+
| ``options.password`` | String      | No          |
+----------------------+-------------+-------------+
| ``options.profile``  | Object      | No          |
+----------------------+-------------+-------------+

Resolves with an argument.

Rejects with any errors thrown by the function originally passed into the Constructor.

Example

.. code:: js

    hoodie.account.validate({
        username: 'DocsChicken',
        password: 'secret'
    })

    .then(function () {
        console.log('Successfully validated!')
    })

    .catch(function (error) {
        console.log(error) // should be an error about the password being too short
    })

hoodie.account.signUp
---------------------

Creates a new user account on the Hoodie server.
Does `not` sign in the user automatically, :ref:`label-hoodie-account-signIn` must be called separately.

.. code:: js

    hoodie.account.signUp(accountProperties)

+--------------------------------+---------+----------+
| Argument                       | Type    | Required |
+================================+=========+==========+
| ``accountProperties.username`` | String  | Yes      |
+--------------------------------+---------+----------+
| ``accountProperties.password`` | String  | Yes      |
+--------------------------------+---------+----------+

Resolves with ``accountProperties``:

.. code:: js

    {
        "id": "account123",
        "username": "pat",
        "createdAt": "2016-01-01T00:00.000Z",
        "updatedAt": "2016-01-01T00:00.000Z"
    }

Rejects with:

+----------------------+-----------------------------------------+
| InvalidError	       | Username must be set                    |
+======================+=========================================+
| ``SessionError``     | Must sign out first                     |
+----------------------+-----------------------------------------+
| ``ConflictError``    | Username **<username>** already exists  |
+----------------------+-----------------------------------------+
| ``ConnectionError``  | Could not connect to server             |
+----------------------+-----------------------------------------+

Example

.. code:: js

    hoodie.account.signUp({
        username: 'pat',
        password: 'secret'
    }).then(function (accountProperties) {
        alert('Account created for ' + accountProperties.username)
    }).catch(function (error) {
        alert(error)
    })


.. _label-hoodie-account-signIn:

hoodie.account.signIn
---------------------

Creates a user session

.. code::

    hoodie.account.signIn(options)

+----------------------+--------+-------------+----------+
| Argument             | Type   | Description | Required |
+======================+========+=============+==========+
| ``options.username`` | String | -           | Yes      |
+----------------------+--------+-------------+----------+
| ``options.password`` | String | -           | Yes      |
+----------------------+--------+-------------+----------+

Resolves with ``accountProperties``:

.. code::

    {
        "id": "account123",
        "username": "pat",
        "createdAt": "2016-01-01T00:00.000Z",
        "updatedAt": "2016-01-02T00:00.000Z",
        "profile": {
            "fullname": "Dr. Pat Hook"
        }
    }

Rejects with:

+-----------------------+-------------------------------------------------------------------------------------------------------+
| ``UnconfirmedError``  | Account has not been confirmed yet                                                                    |
+-----------------------+-------------------------------------------------------------------------------------------------------+
| ``UnauthorizedError`` | Invalid Credentials                                                                                   |
+-----------------------+-------------------------------------------------------------------------------------------------------+
| ``Error``             | `A custom error set on the account object, e.g. the account could be blocked due to missing payments` |
+-----------------------+-------------------------------------------------------------------------------------------------------+
| ``ConnectionError``   | Could not connect to server                                                                           |
+-----------------------+-------------------------------------------------------------------------------------------------------+

Example

.. code::

    hoodie.account.signIn({
        username: 'pat',
        password: 'secret'
    }).then(function (sessionProperties) {
        alert('Ohaj, ' + sessionProperties.username)
    }).catch(function (error) {
        alert(error)
    })

hoodie.account.signOut
----------------------

Deletes the user’s session

.. code:: js

    hoodie.account.signOut()

Resolves with ``sessionProperties`` like :ref:`label-hoodie-account-signIn`, but without the session id:

.. code:: js

    {
        "account": {
            "id": "account123",
            "username": "pat",
            "createdAt": "2016-01-01T00:00.000Z",
            "updatedAt": "2016-01-02T00:00.000Z",
            "profile": {
                "fullname": "Dr. Pat Hook"
            }
        }
    }

Rejects with:

+-----------+------------------------------------------------------+
| ``Error`` | A custom error thrown in a ``before:signout`` hook   |
+-----------+------------------------------------------------------+

Example

.. code:: js

    hoodie.account.signOut().then(function (sessionProperties) {
        alert('Bye, ' + sessionProperties.username)
    }).catch(function (error) {
        alert(error)
    })

hoodie.account.destroy
----------------------

Destroys the account of the currently signed in user.

.. code:: js

    hoodie.account.destroy()

Resolves with ``sessionProperties`` like :ref:`label-hoodie-account-signIn`, but without the session id:

.. code:: js

    {
        "account": {
            "id": "account123",
            "username": "pat",
            "createdAt": "2016-01-01T00:00.000Z",
            "updatedAt": "2016-01-02T00:00.000Z",
            "profile": {
                "fullname": "Dr. Pat Hook"
            }
        }
    }

Rejects with:

+---------------------+----------------------------------------------------+
| ``Error``           | A custom error thrown in a ``before:destroy`` hook |
+---------------------+----------------------------------------------------+
| ``ConnectionError`` | Could not connect to server                        |
+---------------------+----------------------------------------------------+

Example

.. code::

    hoodie.account.destroy().then(function (sessionProperties) {
        alert('Bye, ' + sessionProperties.username)
    }).catch(function (error) {
        alert(error)
    })

hoodie.account.get
------------------

Returns account properties from local cache.

.. code:: js

    hoodie.account.get(properties)

+-----------------+------------------------------------+---------------------------------------------------------------------------------------------------------+------------+
| Argument        | Type                               | Description                                                                                             | Required   |
+=================+====================================+=========================================================================================================+============+
| ``properties``  | String or Array of strings         | When String, only this property gets returned. If array of strings, only passed properties get returned | No         |
+-----------------+------------------------------------+---------------------------------------------------------------------------------------------------------+------------+

Returns object with account properties, or ``undefined`` if not signed in.

Examples

.. code:: js

    var properties = hoodie.account.get()
    alert('You signed up at ' + properties.createdAt)
    var createdAt = hoodie.account.get('createdAt')
    alert('You signed up at ' + createdAt)
    var properties = hoodie.account.get(['createdAt', 'updatedAt'])
    alert('You signed up at ' + properties.createdAt)

hoodie.account.fetch
-------------------------

Fetches account properties from server.

.. code:: js

    hoodie.account.fetch(properties)

+----------------+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+
| Argument       | Type                       | Description                                                                                                                                                                  | Required    |
+================+============================+==============================================================================================================================================================================+=============+
| ``properties`` | String or Array of strings | When String, only this property gets returned. If array of strings, only passed properties get returned. Property names can have '.' separators to return nested properties. | No          |
+----------------+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+-------------+

Resolves with ``accountProperties``:

.. code:: js

    {
        "id": "account123",
        "username": "pat",
        "createdAt": "2016-01-01T00:00.000Z",
        "updatedAt": "2016-01-02T00:00.000Z"
    }

Rejects with:

+---------------------------+------------------------------+
| ``UnauthenticatedError``  | Session is invalid           |
+---------------------------+------------------------------+
| ``ConnectionError``       | Could not connect to server  |
+---------------------------+------------------------------+

Examples

.. code:: js

    hoodie.account.fetch().then(function (properties) {
        alert('You signed up at ' + properties.createdAt)
    })
    hoodie.account.fetch('createdAt').then(function (createdAt) {
        alert('You signed up at ' + createdAt)
    })
    hoodie.account.fetch(['createdAt', 'updatedAt']).then(function (properties) {
        alert('You signed up at ' + properties.createdAt)
    })

hoodie.account.update
---------------------

Update account properties on server and local cache

.. code:: js

    hoodie.account.update(changedProperties)

+-----------------------+-----------+--------------------------------------------------------------------------------+----------+
| Argument              | Type      | Description                                                                    | Required |
+=======================+===========+================================================================================+==========+
| ``changedProperties`` | Object    | Object of properties & values that changed. Other properties remain unchanged. | No       |
+-----------------------+-----------+--------------------------------------------------------------------------------+----------+

Resolves with accountProperties:

.. code:: js

    {
        "id": "account123",
        "username": "pat",
        "createdAt": "2016-01-01T00:00.000Z",
        "updatedAt": "2016-01-01T00:00.000Z"
    }

Rejects with:

+--------------------------+----------------------------------------+
| ``UnauthenticatedError`` | Session is invalid                     |
+--------------------------+----------------------------------------+
| ``InvalidError``         | Custom validation error                |
+--------------------------+----------------------------------------+
| ``ConflictError``        | Username **<username>** already exists |
+--------------------------+----------------------------------------+
| ``ConnectionError``      | Could not connect to server            |
+--------------------------+----------------------------------------+

Example

.. code:: js

    hoodie.account.update({username: 'treetrunks'}).then(function (properties) {
        alert('You are now known as ' + properties.username)
    })

hoodie.account.profile.get
-------------------

Returns profile properties from local cache.

.. code:: js

    hoodie.account.profile.get(properties)

+----------------+-----------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------+
| Argument       | Type                        | Description                                                                                                                                                                   | Required   |
+================+=============================+===============================================================================================================================================================================+============+
| ``properties`` | String or Array of strings  | When String, only this property gets returned. If array of strings, only passed properties get returned. Property names can have `.` separators to return nested properties.  | No         |
+----------------+-----------------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+------------+

Returns object with profile properties, falls back to empty object ``{}``. Returns ``undefined`` if not signed in.

Examples

.. code:: js

    var properties = hoodie.account.profile.get()
    alert('Hey there ' + properties.fullname)
    var fullname = hoodie.account.profile.get('fullname')
    alert('Hey there ' + fullname)
    var properties = hoodie.account.profile.get(['fullname', 'address.city'])
    alert('Hey there ' + properties.fullname + '. How is ' + properties.address.city + '?')

hoodie.account.profile.fetch
---------------------

Fetches profile properties from server.

.. code:: js

    hoodie.account.profile.fetch(options)

+----------------+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument       | Type                       | Description                                                                                                                                                                  | Required |
+================+============================+==============================================================================================================================================================================+==========+
| ``properties`` | String or Array of strings | When String, only this property gets returned. If array of strings, only passed properties get returned. Property names can have '.' separators to return nested properties. | No       |
+----------------+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

Resolves with ``profileProperties``:

.. code:: js

    {
        "id": "account123-profile",
        "fullname": "Dr Pat Hook",
        "address": {
            "city": "Berlin",
            "street": "Adalberststraße 4a"
        }
    }

Rejects with:

+--------------------------+--------------------------------+
| ``UnauthenticatedError`` | Session is invalid             |
+--------------------------+--------------------------------+
| ``ConnectionError``      | Could not connect to server    |
+--------------------------+--------------------------------+

Examples

.. code:: js

    hoodie.account.fetch().then(function (properties) {
        alert('Hey there ' + properties.fullname)
    })
    hoodie.account.fetch('fullname').then(function (fullname) {
        alert('Hey there ' + fullname)
    })
    hoodie.account.fetch(['fullname', 'address.city']).then(function (properties) {
        alert('Hey there ' + properties.fullname + '. How is ' + properties.address.city + '?')
    })

hoodie.account.profile.update
----------------------

Update profile properties on server and local cache

.. code:: js

    hoodie.account.profile.update(changedProperties)

+-----------------------+--------+--------------------------------------------------------------------------------+----------+
| Argument              | Type   | Description                                                                    | Required |
+=======================+========+================================================================================+==========+
| ``changedProperties`` | Object | Object of properties & values that changed. Other properties remain unchanged. | No       |
+-----------------------+--------+--------------------------------------------------------------------------------+----------+

Resolves with ``profileProperties``:

.. code:: js

    {
        "id": "account123-profile",
        "fullname": "Dr Pat Hook",
        "address": {
            "city": "Berlin",
            "street": "Adalberststraße 4a"
        }
    }

Rejects with:

+--------------------------+------------------------------------+
| ``UnauthenticatedError`` | Session is invalid                 |
+--------------------------+------------------------------------+
| ``InvalidError``         | `Custom validation error`          |
+--------------------------+------------------------------------+
| ``ConnectionError``      | Could not connect to server        |
+--------------------------+------------------------------------+

Example

.. code:: js

    hoodie.account.profile.update({fullname: 'Prof Pat Hook'}).then(function (properties) {
        alert('Congratulations, ' + properties.fullname)
    })

hoodie.account.request
---------------

Sends a custom request to the server, for things like password resets, account upgrades, etc.

.. code:: js

    hoodie.account.request(properties)

+---------------------+--------+------------------------------------------------+----------+
| Argument            | Type   | Description                                    | Required |
+=====================+========+================================================+==========+
| ``properties.type`` | String | Name of the request type, e.g. "passwordreset" | Yes      |
+---------------------+--------+------------------------------------------------+----------+
| ``properties``      | Object | Additional properties for the request          | No       |
+---------------------+--------+------------------------------------------------+----------+

Resolves with ``requestProperties``:

.. code:: js

    {
        "id": "request123",
        "type": "passwordreset",
        "contact": "pat@example.com",
        "createdAt": "2016-01-01T00:00.000Z",
        "updatedAt": "2016-01-01T00:00.000Z"
    }

Rejects with:

+---------------------+---------------------------------------+
| ``ConnectionError`` | Could not connect to server           |
+---------------------+---------------------------------------+
| ``NotFoundError``   | Handler missing for "passwordreset"   |
+---------------------+---------------------------------------+
| ``InvalidError``    | `Custom validation error`             |
+---------------------+---------------------------------------+

Example

.. code:: js

    hoodie.account.request({type: 'passwordreset', contact: 'pat@example.com'}).then(function (properties) {
        alert('A password reset link was sent to ' + properties.contact)
    })

hoodie.account.on
----------

.. code:: js

    hoodie.account.on(event, handler)

Example

.. code:: js

    hoodie.account.on('signin', function (accountProperties) {
        alert('Hello there, ' + accountProperties.username)
    })

hoodie.account.one
-----------

Call function once at given account event.

.. code:: js

    hoodie.account.one(event, handler)

Example

.. code:: js

    hoodie.account.one('signin', function (accountProperties) {
        alert('Hello there, ' + accountProperties.username)
    })

hoodie.account.off
-----------

Removes event handler that has been added before

.. code:: js

    hoodie.account.off(event, handler)

Example

.. code:: js

    hoodie.account.off('singin', showNotification)

Events
------

+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| Event              | Description                                                                     | Arguments                                        |
+====================+=================================================================================+==================================================+
| ``signup``         | New user account created successfully                                           | ``accountProperties`` with ``.session property`` |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``signin``         | Successfully signed in to an account                                            | ``accountProperties`` with ``.session property`` |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``signout``        | Successfully signed out                                                         | ``accountProperties`` with ``.session property`` |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``passwordreset``  | Email with password reset token sent                                            |                                                  |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``unauthenticate`` | Server responded with "unauthenticated" when checking session                   |                                                  |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``reauthenticate`` | Successfully signed in with the same username (useful when session has expired) | ``accountProperties`` with ``.session property`` |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+
| ``update``         | Successfully updated an account's properties                                    | ``accountProperties`` with ``.session property`` |
+--------------------+---------------------------------------------------------------------------------+--------------------------------------------------+

Hooks
-----

.. code:: js

    // clear user’s local store signin and after signout
    hoodie.account.hook.before('signin', function (options) {
        return localUserStore.clear()
    })
    hoodie.account.hook.after('signout', function (options) {
        return localUserStore.clear()
    })

+-------------+-------------------------------------------------------------------------+
| Hook        | Arguments                                                               |
+=============+=========================================================================+
| ``signin``  | ``options`` as they were passed into ``hoodie.account.signIn(options)`` |
+-------------+-------------------------------------------------------------------------+
| ``signout`` | ``{}``                                                                  |
+-------------+-------------------------------------------------------------------------+

See `before-after-hook <https://www.npmjs.com/package/before-after-hook>`_ for more information.

Requests
--------

Hoodie comes with a list of built-in account requests, which can be disabled, overwritten or extended in `hoodie-account-server <https://github.com/hoodiehq/hoodie-account-server/tree/master/plugin#optionsrequests>`_.

When a request succeeds, an event with the same name as the request type gets emitted. For example, ``hoodie.account.request({type: 'passwordreset', contact: 'pat@example.com')`` triggers a ``passwordreset`` event, with the ``requestProperties`` passed as argument.

+--------------------+----------------------------------------+
| ``passwordreset``  | Request a password reset token         |
+--------------------+----------------------------------------+

Testing
-------

Local setup

.. code::

    git clone https://github.com/hoodiehq/hoodie-account-client.git
    cd hoodie-account-client

In Node.js

Run all tests and validate JavaScript Code Style using `standard <https://www.npmjs.com/package/standard>`_

.. code::

    npm test

To run only the tests

.. code::

    npm run test:node

To test hoodie-account-client in a browser you can link it into `hoodie-account <https://github.com/hoodiehq/hoodie-account>`_, which provides a dev-server:

.. code::

    git clone https://github.com/hoodiehq/hoodie-account.git
    cd hoodie-account
    npm install
    npm link /path/to/hoodie-account-client
    npm start

hoodie-account bundles hoodie-account-client on ``npm start``, so you need to restart hoodie-account to see your changes.
