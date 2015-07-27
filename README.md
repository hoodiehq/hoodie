![The Low-Profile Dog Hoodie Mascot](https://avatars1.githubusercontent.com/u/1888826?v=3&s=200)

# Welcome to `hoodie-server!` 🎉

[![Build Status](https://travis-ci.org/hoodiehq/hoodie-server.svg?branch=next)](https://travis-ci.org/hoodiehq/hoodie-server)
[![Dependency Status](https://david-dm.org/hoodiehq/hoodie-server/next.svg)](https://david-dm.org/hoodiehq/hoodie-server/next)
[![devDependency Status](https://david-dm.org/hoodiehq/hoodie-server/next/dev-status.svg)](https://david-dm.org/hoodiehq/hoodie-server/next#info=dependencies)


`hoodie-server` is the core server component of Hoodie. Together with `hoodie-client`, it forms the two parts that make up the Hoodie system.

`hoodie-server` is responsible for a number of things on the server:

- check the environment to make sure Hoodie can run properly
- start an instance of CouchDB, Hoodie’s database
- start a webserver each for the Hoodie app itself and the Hoodie Admin Dashboard
- start all Hoodie plugins that might be installed

`hoodie-server` isn’t meant to be used by itself and it is used by the `hoodie` module, which also inlcude `hoodie-client` to form Hoodie.

You can use `hoodie-server` on its own, if you want to work on it, help fix bugs or test new versions. And when you are writing your own plugin, you can use `hoodie-server` for debugging.

## Usage

As noted before, this isn’t meant to be run standalone, but if you are helping out with development, or build your own plugins, or just want to spelunk around, here’s how it works:

```
git clone git@github.com:hoodiehq/server.git
cd server
npm install
```

When that’s done, you can run `./bin/start` to start `hoodie-server`. Usually, `hoodie-server` is run within the context of an existing frontend application, but when you run it alone, it will use its `www/` directory to serve the web app. For now, this is just a simple `index.html` file that says `hi`.

There are a few options to change the behaviour of `hoodie-server`. See a list by running `./bin/start --help`. It looks something like this:

```
Usage: node ./bin/start [options]

Options:
  --www           Set www root directory
  --custom-ports  Provide custom ports www,admin,couchdb
  --help          Show usage information
  --verbose       Shows more verbose console output
  --debug         Shows hapi internal debug output
```

If that doesn’t make much sense just yet, don’t worry about it.

## Testing

The `hoodie-server` test suite is run with `npm test`.

The tests live in `test/unit` and `test/integration`. `test/unit` tests (or “unit tests”) are to test the behaviour of individual sub-modules within `hoodie-server`, while `test/integration` tests (or “integration tests”) are used to test the behaviour of a fully running instance of `hoodie-server`, e.g. the behaviour of its HTTP API.

If you are adding new features to `hoodie-server` you should provide test cases for the new feature. Depending on the feature, you either best write unit tests or integration tests and sometimes even both. The more tests we have, the more confidently we can release future versions of `hoodie-server`.

## Need Help?

// how to ask for support
//  chat
//  issues
// how to file bug reports

## Wanna help?

// point to hoodie/CONTRIBUTING.md

## License

Apache 2.0
