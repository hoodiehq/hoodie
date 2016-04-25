# Welcome to Hoodie 🎉

<img src="https://avatars1.githubusercontent.com/u/1888826?v=3&s=200"
 alt="The Low-Profile Dog Hoodie Mascot" title="The Low-Profile Dog Hoodie Mascot" align="right" />

> A very promising open-source library for building offline-first apps.
> — Smashing Magazine

> The Hoodie team is one of the nicest and welcoming that I’ve ever known.
> — Katrin Apel

> ❤ Hood.ie - a fast offline-first architecture for webapps. Super-simple user management & storage. Great for mobile.
> — Addy Osmani

[![Join our Chat](https://img.shields.io/badge/Chat-IRC%20or%20Slack-blue.svg)](http://hood.ie/chat)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![Build Status](https://travis-ci.org/hoodiehq/hoodie.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie)
[![Dependency Status](https://david-dm.org/hoodiehq/hoodie.svg)](https://david-dm.org/hoodiehq/hoodie)
[![devDependency Status](https://david-dm.org/hoodiehq/hoodie/dev-status.svg)](https://david-dm.org/hoodiehq/hoodie#info=devDependencies)

## Setup

`npm install --save hoodie@camp`

Add this to your `package.json`:

```json
"scripts": {
  "start": "hoodie"
}
```

Now run `npm start` to start your Hoodie app.

## Usage

Run `npm start -- --help` to see all available CLI options.

Options can also be specified as environment variables (prefixed with "hoodie_") or inside a ".hoodierc" file (json or ini).

option        | default                            | description
------------- | ---------------------------------- | -------------
loglevel      | 'warn'                             |
port          | 8080                               | Port-number to run the Hoodie App on
bindAddress   | 127.0.0.1                          | Address that Hoodie binds to
public        | path.join(options.path, 'public')  | path to static assets
inMemory      | false                              | Whether to start the PouchDB Server in memory
dbUrl         | PouchDB Server                     | If provided does not start PouchDB Server and uses external CouchDB. Has to contain credentials.
data          | path.join(options.path, '.hoodie') | Data path

## Testing

The `hoodie` test suite is run with `npm test`.

The tests live in `test/unit` and `test/integration`. `test/unit` tests (or “unit tests”) are to test the behaviour of individual sub-modules within `hoodie`, while `test/integration` tests (or “integration tests”) are used to test the behaviour of a fully running instance of `hoodie`, e.g. the behaviour of its HTTP API.

If you are adding new features to `hoodie` you should provide test cases for the new feature. Depending on the feature, it's either best to write unit tests or integration tests and sometimes even both. The more tests we have, the more confidently we can release future versions of `hoodie`.


## Architecture

Hoodie is server built on top of [hapi](http://hapijs.com) with frontend APIs
for account and store related tasks.

It consists of three main components

1. [**account**](https://github.com/hoodiehq/hoodie-account)  
   Hoodie’s account module. It exposes a [JSON API](http://jsonapi.org/), a
   a corresponding client and a generic account UI.

1. [**store**](https://github.com/hoodiehq/hoodie-store)  
   Hoodie’s store module. It exposes [CouchDB’s Document API](https://wiki.apache.org/couchdb/HTTP_Document_API),
   a corresponding client and a generic store UI.

1. [**client**](https://github.com/hoodiehq/hoodie-client)  
   Hoodie’s front-end client for the browser. It integrates the following client modules:
   1. [account-client](https://github.com/hoodiehq/hoodie-account-client)
   2. [store-client](https://github.com/hoodiehq/hoodie-store-client)
   3. [log-client](https://github.com/hoodiehq/hoodie-log-client)
   4. [connection-status](https://github.com/hoodiehq/hoodie-connection-status)

## Need help or want to help?

It’s best to join our [chat](http://hood.ie/chat/).

## License

[Apache 2.0](LICENSE)
