hoodie.log
==========

``hoodie-log`` is a standalone JavaScript library for logging to the browser console. 
If available, it takes advantage of `CSS-based styling of console log outputs <https://developer.mozilla.org/en-US/docs/Web/API/Console#Styling_console_output>`_.

Example
-------

.. code:: js

    var log = new Log('hoodie')

    log('ohaj!')
    // (hoodie) ohaj!
    log.debug('This will help with debugging.')
    // (hoodie:debug) This will help with debugging.
    log.info('This might be of interest. Or not.')
    // (hoodie:info) This might be of interest. Or not.
    log.warn('Something is fishy here!')
    // (hoodie:warn) Something is fishy here!
    log.error('oooops')
    // (hoodie:error) oooops

    var fooLog = log.scoped('foo')
    fooLog('baz!')
    // (hoodie:foo) baz!

Constructor
-----------

.. code:: js

    new Log(prefix)
    // or
    new Log(options)

+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| Argument           | Type              | Description                                                                                                                                                                                                                                   | Required |
+====================+===================+===============================================================================================================================================================================================================================================+==========+
| ``prefix``         | String            | Prefix for log messages                                                                                                                                                                                                                       | Yes      |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``options.prefix`` | String            | Prefix for log messages                                                                                                                                                                                                                       | Yes      |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``options.level``  | String            | Defaults to ``warn``. One of ``debug``, ``info``, ``warn`` or ``error``. ``debug`` is the lowest level, and everything will be logged to the console. ``error`` is the highest level and nothing but errors will be logged.                   | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles``         | Boolean or Object | Defaults to ``true``. If set to false, all log messages are prefixed by ``(<prefix>:<log type>)``, e.g. ``(fooprefix:warn) bar is not available.``. If set to true, styles are applied to the prefix. The styles can be customised, see below | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.default`` | String            | Defaults to ``color: white; padding: .2em .4em; border-radius: 1em``. Base CSS styles for all log types                                                                                                                                       | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.reset``   | String            | Defaults to ``background: inherit; color: inherit``. Reset CSS styles, applied for message after prefix                                                                                                                                       | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.log``     | String            | Defaults to ``background: gray``. CSS Styles for default log calls without log level                                                                                                                                                          | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.debug``   | String            | Defaults to ``background: green``. CSS Styles for debug logs                                                                                                                                                                                  | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.info``    | String            | Defaults to ``background: blue``. CSS Styles for info logs                                                                                                                                                                                    | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.warn``    | String            | Defaults to ``background: orange``. CSS Styles for warn logs                                                                                                                                                                                  | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+
| ``styles.error``   | String            | Defaults to ``background: red``. CSS Styles for error logs                                                                                                                                                                                    | No       |
+--------------------+-------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+----------+

Example
-------

.. code:: js

    var log = new Log({
        prefix: 'hoodie',
        level: 'warn',
        styles: {
            default: 'color: white; padding: .2em .4em; border-radius: 1em',
            debug: 'background: green',
            log: 'background: gray',
            info: 'background: blue',
            warn: 'background: orange',
            error: 'background: red',
            reset: 'background: inherit; color: inherit'
        }
    }

log.prefix
----------

`Read-only`

.. code:: js

    log.prefix

Prefix used in log messages

Example

.. code:: js
   
    log = new Log('hoodie')
    log.prefix // hoodie
    log.warn("Something is fishy here!")
    // (hoodie:warn) Something is fishy here!

log.level
---------

One of ``debug``, ``info``, ``warn`` or ``error``. ``debug`` is the lowest level, and everything will be logged to the console. 
``error`` is the highest level and nothing but errors will be logged.

.. code::

    log.level

Example

.. code::

    log.level = 'debug'
    log.debug('This will help with debugging.')
    // (hoodie:debug) This will help with debugging.
    log.level = 'info'
    log.debug('This will help with debugging.')
    // <no log>
    log.level = 'foo'
    // throws InvalidValue error

log()
-----

Logs message to browser console. Accepts same arguments as `console.log <https://developer.mozilla.org/en-US/docs/Web/API/Console/log>`_.

.. code:: js

    log("ohaj!")

log.debug()
-----------

Logs debug message to browser console if ``level`` is set to ``debug``. Accepts same arguments as `console.log <https://developer.mozilla.org/en-US/docs/Web/API/Console/log>`_.

.. code:: js

    log.debug('This will help with debugging.')

log.info()
----------

Logs info message to browser console if ``level`` is set to ``debug`` or ``info``. Accepts same arguments as `console.log <https://developer.mozilla.org/en-US/docs/Web/API/Console/log>`_.

.. code:: js

    log.info('This might be of interest. Or not.')

log.warn()
----------

Logs warning to browser console unless ``level`` is set to ``error``. Accepts same arguments as `console.log <https://developer.mozilla.org/en-US/docs/Web/API/Console/log>`_.

.. code:: js

    log.warn('Something is fishy here!')

log.error()
-----------

Logs error message to browser console. Accepts same arguments as `console.log <https://developer.mozilla.org/en-US/docs/Web/API/Console/log>`_.

.. code:: js

    log.error('oooops')

log.scoped()
------------

.. code:: js

    log.scoped(prefix)

+------------+--------+-------------------------+----------+
| Argument   | Type   | Description             | Required |
+============+========+=========================+==========+
| ``prefix`` | String | Prefix for log messages | Yes      |
+------------+--------+-------------------------+----------+

Returns ``log`` API with extended ``prefix``

Example

.. code:: js

    var log = new Log('hoodie')
    log('ohaj!')
    // (hoodie) ohaj!
    var fooLog = log.scoped('foo')
    fooLog('baz!')
    // (hoodie:foo) baz!

Testing
-------

Local setup

::

    git clone git@github.com:hoodiehq/hoodie-log.git
    cd hoodie-log
    npm install

Run all tests and code style checks

::

    npm test

Run all tests on file change

::
    
    npm run test:watch

Run specific tests only

::

    # run .debug() unit tests
    node tests/specs/debug.js 
