# hoodie

> A generic backend with a client API for Offline First applications

[![Build Status](https://travis-ci.org/hoodiehq/hoodie.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie)
[![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie/badge.svg?branch=master)](https://coveralls.io/r/hoodiehq/hoodie?branch=master)
[![Dependency Status](https://david-dm.org/hoodiehq/hoodie.svg)](https://david-dm.org/hoodiehq/hoodie)
[![devDependency Status](https://david-dm.org/hoodiehq/hoodie/dev-status.svg)](https://david-dm.org/hoodiehq/hoodie#info=devDependencies)

<table>
  <tr>
    <td>
       <a href="https://hacktoberfest.digitalocean.com/"><img height="200" src="https://dl.dropboxusercontent.com/u/732913/hacktoberfest.png"
 alt="Hacktoberfest 2016 Banner"align="right" /></a>
      <a href="http://hood.ie/animals/#low-profile-dog"><img src="https://avatars1.githubusercontent.com/u/1888826?v=3&s=200"
 alt="The Low-Profile Dog Hoodie Mascot" title="The Low-Profile Dog Hoodie Mascot" align="right" /></a>

 
      <h2> Hallo <a href="https://hacktoberfest.digitalocean.com/">Hacktoberfest</a> Friends 🐶👋</h2>
      
      <p>
        We have some great issues prepared for you to work on, check out our <a href="https://github.com/hoodiehq/camp/issues">Hoodie Camp</a> repository :) If you have any questions or just want to say hi, please ping us <a href="https://twitter.com/hoodiehq">on Twitter</a> or join our <a href="http://hood.ie/chat/">Chat</a>. We are looking forward to meet you all! Happy hacktobering!  🙌💻
      </p>
    </td>
  </tr>
</table>


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
or higher and npm Version 2 or higher, check your installed version with `node -v` and `npm -v`.

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
        https://github.com/hoodiehq/hoodie/pull/592
-->

Now simply use `npm start` to start up your Hoodie app!

You can find a more thorough description in our [Getting Started Guide](http://docs.hood.ie/camp/start/index.html).

## Usage

`hoodie` can be used as as CLI (Command Line Interface) or as [hapi plugin](http://hapijs.com/tutorials/plugins).
The options are slightly different, see below

### CLI

Once you finished the [setup](#setup), you can start your hoodie server with

```
npm start
```

To pass CLI options to Hoodie, you have to separate them with `--`, for example:

```
npm start -- --port=8090 --inMemory
```

Available CLI options are

option                    | default       | description
------------------------- | ------------- | -------------
`--address`               | `'127.0.0.1'` | Address to which Hoodie binds
`--data`                  | `'.hoodie'`   | Data path
`--dbUrl`                 | –             | If provided, uses external CouchDB. URL has to contain credentials.
`--loglevel`              | `'warn'`      | One of: silent, error, warn, http, info, verbose, silly
`-m`, `--inMemory`        | `false`       | Whether to start the PouchDB Server in memory
`--port`                  | `8080`        | Port-number to run the Hoodie App on
`--public`                | `'public'`    | path to static assets
`--url`                   | -             | Optional: external URL at which Hoodie Server is accessible (e.g. `http://myhoodieapp.com`)
`-h`, `--help`, `--usage` | -             | Prints help and available options
`-v`, `--version`         | -             | Shows Hoodie version

Hoodie CLI is using [rc](https://www.npmjs.com/package/rc) for configuration, so the same options can be set with environment variables and config files. Environment variables are prefixed with `hoodie_`. Examples: `hoodie_port=8090` or `hoodie_inMemory=true`. Configuration files can be in INI or JSON format and [can be placed at different locations](https://www.npmjs.com/package/rc#standards). Most commonly you would place a `.hoodierc` file in your app’s directory, and it can look like this

```js
{
  port: 8090,
  inMemory: true
}
```

The priority of configuration:

1. command line arguments
2. Environment variables
3. `.hoodierc` files
4. Your app’s defaults form `"hoodie"` key in `"package.json"`
5. Hoodie’s defaults as shown in table above

### hapi plugin

You can load `hoodie` as hapi plugin to use it in your existing hapi application:

```js
var Hapi = require('hapi')
var hoodie = require('hoodie').register

var server = new Hapi.Server()
server.connection({
  host: 'localhost',
  port: 8000
})

server.register({
  register: hoodie,
  options: { // pass options here
    inMemory: true,
    public: 'dist'
  }
}, function (error) {
  if (error) {
    throw error
  }

  server.start(function (error) {
    if (error) {
      throw error
    }

    console.log(('Server running at:', server.info.uri)
  })
})
```

The available options are

option                    | default      | description
------------------------- | ------------ | -------------
**paths.data**            | `'.hoodie'`  | Data path
**paths.public**          | `'public'`   | Public path
**db**                    | –            | [PouchDB options](https://pouchdb.com/api.html#create_database)
**inMemory**              | `false`      | If set to true, configuration and other files will not be read from / written to the file system
**client**                | `{}`         | [Hoodie Client](https://github.com/hoodiehq/hoodie-client#constructor) options. `client.url` is set based on hapi’s `server.info.host`
**account**               | `{}`         | [Hoodie Account Server](https://github.com/hoodiehq/hoodie-account-server/tree/master/plugin#options) options. `account.admins`, `account.secret` and `account.usersDb` are set based on `db` option above.
**store**                 | `{}`         | [Hoodie Store Server](https://github.com/hoodiehq/hoodie-store-server#options) options. `store.couchdb`, `store.PouchDB` are set based on `db` option above. `store.hooks.onPreAuth` is set to bind user authentication for Hoodie Account to Hoodie Store.

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

## Backers

[Become a backer](https://opencollective.com/hoodie#support) and show your Hoodie support!

[![](https://opencollective.com/hoodie/backer/0/avatar)](https://opencollective.com/hoodie/backer/0/website)
[![](https://opencollective.com/hoodie/backer/1/avatar)](https://opencollective.com/hoodie/backer/1/website)
[![](https://opencollective.com/hoodie/backer/2/avatar)](https://opencollective.com/hoodie/backer/2/website)
[![](https://opencollective.com/hoodie/backer/3/avatar)](https://opencollective.com/hoodie/backer/3/website)
[![](https://opencollective.com/hoodie/backer/4/avatar)](https://opencollective.com/hoodie/backer/4/website)
[![](https://opencollective.com/hoodie/backer/5/avatar)](https://opencollective.com/hoodie/backer/5/website)
[![](https://opencollective.com/hoodie/backer/6/avatar)](https://opencollective.com/hoodie/backer/6/website)
[![](https://opencollective.com/hoodie/backer/7/avatar)](https://opencollective.com/hoodie/backer/7/website)
[![](https://opencollective.com/hoodie/backer/8/avatar)](https://opencollective.com/hoodie/backer/8/website)
[![](https://opencollective.com/hoodie/backer/9/avatar)](https://opencollective.com/hoodie/backer/9/website)
[![](https://opencollective.com/hoodie/backer/10/avatar)](https://opencollective.com/hoodie/backer/10/website)
[![](https://opencollective.com/hoodie/backer/11/avatar)](https://opencollective.com/hoodie/backer/11/website)
[![](https://opencollective.com/hoodie/backer/12/avatar)](https://opencollective.com/hoodie/backer/12/website)
[![](https://opencollective.com/hoodie/backer/13/avatar)](https://opencollective.com/hoodie/backer/13/website)
[![](https://opencollective.com/hoodie/backer/14/avatar)](https://opencollective.com/hoodie/backer/14/website)
[![](https://opencollective.com/hoodie/backer/15/avatar)](https://opencollective.com/hoodie/backer/15/website)
[![](https://opencollective.com/hoodie/backer/16/avatar)](https://opencollective.com/hoodie/backer/16/website)
[![](https://opencollective.com/hoodie/backer/17/avatar)](https://opencollective.com/hoodie/backer/17/website)
[![](https://opencollective.com/hoodie/backer/18/avatar)](https://opencollective.com/hoodie/backer/18/website)
[![](https://opencollective.com/hoodie/backer/19/avatar)](https://opencollective.com/hoodie/backer/19/website)
[![](https://opencollective.com/hoodie/backer/20/avatar)](https://opencollective.com/hoodie/backer/20/website)
[![](https://opencollective.com/hoodie/backer/21/avatar)](https://opencollective.com/hoodie/backer/21/website)
[![](https://opencollective.com/hoodie/backer/22/avatar)](https://opencollective.com/hoodie/backer/22/website)
[![](https://opencollective.com/hoodie/backer/23/avatar)](https://opencollective.com/hoodie/backer/23/website)
[![](https://opencollective.com/hoodie/backer/24/avatar)](https://opencollective.com/hoodie/backer/24/website)
[![](https://opencollective.com/hoodie/backer/25/avatar)](https://opencollective.com/hoodie/backer/25/website)
[![](https://opencollective.com/hoodie/backer/26/avatar)](https://opencollective.com/hoodie/backer/26/website)
[![](https://opencollective.com/hoodie/backer/27/avatar)](https://opencollective.com/hoodie/backer/27/website)
[![](https://opencollective.com/hoodie/backer/28/avatar)](https://opencollective.com/hoodie/backer/28/website)
[![](https://opencollective.com/hoodie/backer/29/avatar)](https://opencollective.com/hoodie/backer/29/website)

## Official Sponsors

Show your support for Hoodie and [help us sustain our inclusive community](http://hood.ie/blog/sustaining-hoodie.html). We will publicly appreciate your support and are happy to get your word out, as long as it aligns with our [Code of Conduct](http://hood.ie/code-of-conduct/).

[![](https://opencollective.com/hoodie/sponsor/0/avatar)](https://opencollective.com/hoodie/sponsor/0/website)
[![](https://opencollective.com/hoodie/sponsor/1/avatar)](https://opencollective.com/hoodie/sponsor/1/website)
[![](https://opencollective.com/hoodie/sponsor/2/avatar)](https://opencollective.com/hoodie/sponsor/2/website)
[![](https://opencollective.com/hoodie/sponsor/3/avatar)](https://opencollective.com/hoodie/sponsor/3/website)
[![](https://opencollective.com/hoodie/sponsor/4/avatar)](https://opencollective.com/hoodie/sponsor/4/website)
[![](https://opencollective.com/hoodie/sponsor/5/avatar)](https://opencollective.com/hoodie/sponsor/5/website)
[![](https://opencollective.com/hoodie/sponsor/6/avatar)](https://opencollective.com/hoodie/sponsor/6/website)
[![](https://opencollective.com/hoodie/sponsor/7/avatar)](https://opencollective.com/hoodie/sponsor/7/website)
[![](https://opencollective.com/hoodie/sponsor/8/avatar)](https://opencollective.com/hoodie/sponsor/8/website)
[![](https://opencollective.com/hoodie/sponsor/9/avatar)](https://opencollective.com/hoodie/sponsor/9/website)
[![](https://opencollective.com/hoodie/sponsor/10/avatar)](https://opencollective.com/hoodie/sponsor/10/website)
[![](https://opencollective.com/hoodie/sponsor/11/avatar)](https://opencollective.com/hoodie/sponsor/11/website)
[![](https://opencollective.com/hoodie/sponsor/12/avatar)](https://opencollective.com/hoodie/sponsor/12/website)
[![](https://opencollective.com/hoodie/sponsor/13/avatar)](https://opencollective.com/hoodie/sponsor/13/website)
[![](https://opencollective.com/hoodie/sponsor/14/avatar)](https://opencollective.com/hoodie/sponsor/14/website)
[![](https://opencollective.com/hoodie/sponsor/15/avatar)](https://opencollective.com/hoodie/sponsor/15/website)
[![](https://opencollective.com/hoodie/sponsor/16/avatar)](https://opencollective.com/hoodie/sponsor/16/website)
[![](https://opencollective.com/hoodie/sponsor/17/avatar)](https://opencollective.com/hoodie/sponsor/17/website)
[![](https://opencollective.com/hoodie/sponsor/18/avatar)](https://opencollective.com/hoodie/sponsor/18/website)
[![](https://opencollective.com/hoodie/sponsor/19/avatar)](https://opencollective.com/hoodie/sponsor/19/website)

## License

[Apache 2.0](LICENSE)
