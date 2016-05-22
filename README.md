# hoodie

> A generic backend with a client API for Offline First applications

[![Build Status](https://travis-ci.org/hoodiehq/hoodie.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie)
[![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie?branch=master)
[![Dependency Status](https://david-dm.org/hoodiehq/hoodie.svg)](https://david-dm.org/hoodiehq/hoodie)
[![devDependency Status](https://david-dm.org/hoodiehq/hoodie/dev-status.svg)](https://david-dm.org/hoodiehq/hoodie#info=devDependencies)

<a href="http://hood.ie/animals/#low-profile-dog"><img src="https://avatars1.githubusercontent.com/u/1888826?v=3&s=200"
 alt="The Low-Profile Dog Hoodie Mascot" title="The Low-Profile Dog Hoodie Mascot" align="right" /></a>

Hoodie lets you build apps [without _thinking_ about the backend](http://nobackend.org/)
and makes sure that they work great [independent from connectivity](http://offlinefirst.org/).

This is Hoodie’s main repository. It starts a server and serves the client API.
Read more about [how the Hoodie server works](server).

A good place to start is our [Tracker App](https://github.com/hoodiehq/hoodie-app-tracker).
You can play around with Hoodie’s APIs in the browser console and see how it
works all together in its [simple HTML & JavaScript code](https://github.com/hoodiehq/hoodie-app-tracker/tree/master/public).

If you have any questions come say hi in our [chat](http://hood.ie/chat/).

## Setup

Hoodie is a [Node.js](https://nodejs.org/en/) package. You need Node Version 4
or higher, check your installed version with `node -v`.

First, create a folder and a [package.json](https://docs.npmjs.com/files/package.json) file

```
mkdir my-app
cd my-app
npm init -y
```

Next install hoodie and save it as dependency

```
npm install --save hoodie
```

<!--
  TODO: automate package.json update using postinstall
        https://github.com/hoodiehq/hoodie/issues/477
-->
Add a `"start"` script and set it to `"hoodie"` in your `package.json`. The
result should look something like this

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "hoodie",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "hoodie": "^22.0.2"
  }
}
```

There might be more properties and `22.0.2` will likely be a higher number, but
that’s okay.

Now run `npm start` to start your Hoodie app.

You can find a more thorough description in our [Getting Started Guide](http://docs.hood.ie/camp/start/index.html).

## Usage

Run `npm start -- --help` to see all available CLI options.

Options can also be specified as environment variables (prefixed with `hoodie_`) or inside a `.hoodierc` file (json or ini).

option        | default       | description
------------- | ------------- | -------------
loglevel      | `'warn'`      | One of: error, warn, info, verbose, silly
port          | `8080`        | Port-number to run the Hoodie App on
bindAddress   | `'127.0.0.1'` | Address that Hoodie binds to
public        | `'public'`    | path to static assets
inMemory      | `false`       | Whether to start the PouchDB Server in memory
dbUrl         | –             | If provided, uses external CouchDB. URL has to contain credentials.
data          | `'.hoodie'`   | Data path

Hoodie is using the [rc](https://www.npmjs.com/package/rc) module to retrieve
configuration from CLI arguments, environment variables and configuration files.

## Testing

Local setup

```
git clone https://github.com/hoodiehq/hoodie.git
cd hoodie
npm install
```

The `hoodie` test suite is run with `npm test`.
You can [read more about testing Hoodie](test).

You can start hoodie for itself using `npm start`. It will  serve the contents
of the [public folder](public).

## License

[Apache 2.0](LICENSE)
