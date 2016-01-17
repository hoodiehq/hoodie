![The Low-Profile Dog Hoodie Mascot](https://avatars1.githubusercontent.com/u/1888826?v=3&s=200)

# Welcome to `hoodie-server!` 🎉

[![Build Status](https://travis-ci.org/hoodiehq/hoodie-server.svg?branch=next)](https://travis-ci.org/hoodiehq/hoodie-server)
[![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie-server/badge.svg?branch=next&service=github)](https://coveralls.io/github/hoodiehq/hoodie-server?branch=next)
[![Dependency Status](https://david-dm.org/hoodiehq/hoodie-server/next.svg)](https://david-dm.org/hoodiehq/hoodie-server/next)
[![devDependency Status](https://david-dm.org/hoodiehq/hoodie-server/next/dev-status.svg)](https://david-dm.org/hoodiehq/hoodie-server/next#info=dependencies)


`hoodie-server` is the core server component of Hoodie. Together with `hoodie-client`, it forms the two parts that make up the Hoodie system.

`hoodie-server` itself is responsible for only a few things:

- providing a normalized [config](lib/config.js) for itself and all core components/plugins
- providing an API to interact with [databases](lib/database.js) to components/plugins
- starting and configuring a [hapi server](lib/hapi.js) that also serves [static components](lib/static.js) like hoodie-client and hoodie-admin-dashboard

The rest is handled by components like [hoodie-server-account](https://github.com/hoodiehq/hoodie-server-account), or [hoodie-server-store](https://github.com/hoodiehq/hoodie-server-store).

`hoodie-server` isn’t meant to be used by itself and it is used by the `hoodie` module, which also inlcudes `hoodie-client` to form Hoodie.

You can use `hoodie-server` on its own, if you want to work on it, help fix bugs or test new versions. And when you are writing your own components/plugins, you can use `hoodie-server` for debugging.

## Usage

As noted before, this isn’t meant to be run standalone. But if you are helping out with development, building your own components/plugins, or just want to spelunk around, here’s how it works:

```
git clone git@github.com:hoodiehq/hoodie-server.git
cd hoodie-server
npm install hoodie-start@next
npm install
./node_modules/.bin/hoodie-start
```

There are a few options to change the behaviour of `hoodie-server`.

option        | default                        |   description
------------- | -----------------------------  | -------------
path          | process.cwd()                  | Project path
loglevel      | 'warn'                         |
port          | 8080                           | Port-number to run the Hoddie App on
bindAddress   | 127.0.0.1                      | Address that Hoodie binds to
www           | path.join(options.path, 'www') | WWW path
inMemory      | false                          | Whether to start the PouchDB Server in memory
dbUrl         | PouchDB Server                 | If provided does not start PouchDB Server and uses external CouchDB. Has to contain credentials.
data          | path.join(options.path, 'data')| Data path

If that doesn’t make much sense just yet, don’t worry about it.

## Testing

The `hoodie-server` test suite is run with `npm test`.

The tests live in `test/unit` and `test/integration`. `test/unit` tests (or “unit tests”) are to test the behaviour of individual sub-modules within `hoodie-server`, while `test/integration` tests (or “integration tests”) are used to test the behaviour of a fully running instance of `hoodie-server`, e.g. the behaviour of its HTTP API.

If you are adding new features to `hoodie-server` you should provide test cases for the new feature. Depending on the feature, it's either best to write unit tests or integration tests and sometimes even both. The more tests we have, the more confidently we can release future versions of `hoodie-server`.

## Need help or want to help?

It’s best to join our [chat](http://hood.ie/chat/).

## License

Apache 2.0
