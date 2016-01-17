Hoodie uses the [Standard](https://github.com/feross/standard) JavaScript coding style.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more guidelines on
contributing to Hoodie.

Hoodie uses the [Standard](https://github.com/feross/standard) JavaScript
coding style.

This file explains coding-style considerations that are beyond the syntax check
of *Standard*.

There are three sections:

- *General*: coding styles that are applicable to all JavaScript code.
- *Client*: coding styles that are only applicable to in-browser code.
- *Server*: coding styles that are only applicable in server code.

*Note: Client and Server coding styles can be contradicting, make sure to read these carefully*.


## General

Prefer [loadash](https://lodash.com) over [Underscore](http://underscorejs.org "Underscore.js").


## Client

### Libraries with sub-modules that can be required individually, like lodash

For client-side JavaScript code, it is important to limit the amount of code that is downloaded to the client to the code that is actually needed. The [loadash](https://lodash.com) library is a collection of utilities that are useful individually and in combination.

For example, if you want to use the `merge` function of lodash, require it like this:

```javascript
var merge = require('lodash/merge')
```

If you want to use more than one function within one module, or if you want to combine multiple functions for a single operation, require the full lodash module:

```javascript
var _ = require('lodash')
```

If multiple modules use the same lodash function, [our frontend bundling tool](http://browserify.org "Browserify") will do the right thing and only include that code once.


## Server

### Libraries with sub-modules that can be required individually, like lodash

For server-side code, it is important to load the minmal amount of code into memory.
 
On the server require the full library, e.g.

```javascript
var _ = require('lodash')

var c = _.merge(a, b)
```

That way, all of our server code will only ever load a single instance of lodash into memory.

