# hoodie

> A generic backend with a client API for Offline First applications

[![Build Status](https://travis-ci.org/hoodiehq/hoodie.svg?branch=master)](https://travis-ci.org/hoodiehq/hoodie)
[![Coverage Status](https://coveralls.io/repos/hoodiehq/hoodie/badge.svg?branch=master)](https://coveralls.io/github/hoodiehq/hoodie?branch=master)
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

This setup is working for all operating system, testing on Windows 8, Windows 8.1, Windows 10, Mac and Linux.

Hoodie is a [Node.js](https://nodejs.org/en/) package. You need Node Version 4
or higher and npm Version 2 or higher, check your installed version with `node -v` and `npm -v`.

First, create a folder and a [package.json](https://docs.npmjs.com/files/package.json) file

```
mkdir my-app
cd my-app
npm init -y
```

Next, install hoodie and save it as dependency

```
npm install --save hoodie
```

Now start up your Hoodie app

```
npm start
```

You can find a more thorough description in our [Getting Started Guide](http://docs.hood.ie/en/latest/guides/quickstart.html).

## Usage

`hoodie` can be used standalone or as [hapi plugin](http://hapijs.com/tutorials/plugins).
The options are slightly different. For the standalone usage, see [Hoodie’s configuration guide](http://docs.hood.ie/en/latest/guides/configuration.html).
For the hapi plugin usage, see [Hoodie’s hapi plugin usage guide](http://docs.hood.ie/en/latest/guides/hapi-plugin.html)

## Testing

Local setup

```
git clone https://github.com/hoodiehq/hoodie.git
cd hoodie
npm install
```

The `hoodie` test suite is run with `npm test`.
You can [read more about testing Hoodie](test).

You can start hoodie for itself using `npm start`. It will serve the contents
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
