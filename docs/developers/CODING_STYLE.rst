Coding Style Guide
==================

Please see `Contributing to Hoodie <CONTRIBUTING.html>`__ for more guidelines on
contributing to Hoodie.

Hoodie uses the `Standard <https://github.com/feross/standard>`__
JavaScript coding style.

This file explains coding-style considerations that are beyond the
syntax check of *Standard*.

There are three sections:

-  *General*: coding styles that are applicable to all JavaScript code.
-  *Client*: coding styles that are only applicable to in-browser code.
-  *Server*: coding styles that are only applicable in server code.

*Note: Client and Server coding styles can be contradicting, make sure
to read these carefully*.

General
-------

File Structure
~~~~~~~~~~~~~~

A typical JavaScript file looks like this (without the comments). Sort
all modules that you ``require`` alphabetically within their blocks.

.. code:: js

    // If your module exports something, put it on top
    module.exports = myMethod

    // require Node.js core modules in the 1st block (separaeted by empty line).
    // These are modules that come with Node.js and are not listed in package.json.
    // See https://nodejs.org/api/ for a list of Node.js core modules
    var EventEmitter = require('events').EventEmitter
    var util = require('util')

    // In the 2nd block, require all modules listed in package.json
    var async = require('async')
    var lodash = require('lodash')

    // in the 3rd block, require all modules using relative paths
    var helpers = require('./utils/helpers')
    var otherMethod = require('./other-method')

    function myMethod () {
      // code here
    }

Avoid "this" and object-oriented coding styles.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Do this

.. code:: js

    function MyApi (options) {
      var state = {
        foo: options.foo
      }
      return {
        doSomething: doSomething.bind(null, state)
      }
    }

    function doSomething (state) {
      return state.foo ? 'foo!' : 'bar'
    }

Instead of

.. code:: js

    function MyApi (options) {
      this.foo = options.foo
    }

    MyApi.prototype.doSomething = function () {
      return this.foo ? 'foo!' : 'bar'
    }

The `bind
method <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind>`__
allows for `partially applied
functions <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Partially_applied_functions_%28currying%29>`__,
that way we can pass internal state between different methods without
exposing in the public API. At the same time we can easily test the
different methods in isolation by setting the internal state to what
ever context we want to test with.

Folder Structure
~~~~~~~~~~~~~~~~

In the root, have

-  ``package.json``
-  ``.gitignore`` (should at least list node\_modules)
-  ``README.md``
-  ``LICENSE`` (Apache License Version 2.0)

In most cases you will have ``index.js`` file which is listed in
``package.json`` as the ``"main"`` property.

If you want to split up logic into separate files, move them into a
``server/`` folder. Put reusable, state-less helper methods into
``server/utils/``

For tests, create a ``test/`` folder. If your module becomes a bit more
complex, split up the tests in ``test/unit`` and ``test/integration/``.
All files that contain tests should end with ``-test.js``.

Misc
~~~~

-  Prefer `lodash <https://lodash.com>`__ over
   `underscore <http://underscorejs.org>`__.

Client
------

Testing
~~~~~~~

Client code should be tested using
`tape <https://www.npmjs.com/package/tape>`__. The reason we use tape is
its support for
`browserify <https://www.npmjs.com/package/browserify>`__.

Libraries with sub-modules that can be required individually, like lodash
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For client-side JavaScript code, it is important to limit the amount of
code that is downloaded to the client to the code that is actually
needed. The `loadash <https://lodash.com>`__ library is a collection of
utilities that are useful individually and in combination.

For example, if you want to use the ``merge`` function of lodash,
require it like this:

.. code:: javascript

    var merge = require('lodash/merge')

If you want to use more than one function within one module, or if you
want to combine multiple functions for a single operation, require the
full lodash module:

.. code:: javascript

    var _ = require('lodash')

If multiple modules use the same lodash function, `our frontend bundling
tool <http://browserify.org>`__ will do the right thing and only include
that code once.

Server
------

Testing
~~~~~~~

Server code should be tested using
`tap <https://www.npmjs.com/package/tap>`__.

Libraries with sub-modules that can be required individually, like lodash
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For server-side code, it is important to load the minimal amount of code
into memory.

On the server require the full library, e.g.

.. code:: javascript

    var _ = require('lodash')

    var c = _.merge(a, b)

That way, all of our server code will only ever load a single instance
of lodash into memory.
