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

## Installation

`npm install --save @hoodie/dev-top-level`

_Note: In the future this will be `npm install --save hoodie`, but this is a temporary developer preview name._

Add this to your `package.json`:

```json
"scripts": {
  "start": "hoodie"
},
"hoodie": {
  "plugins": [
    "hoodie-plugin-appconfig",
    "hoodie-plugin-email",
    "hoodie-plugin-users"
  ]
}
```

That's it! Running `npm start` will now serve a hoodie-app from your `www` folder.

Run `npm start -- --help` to see more options.

## Why is there no code in this repo?

Hoodie consists of many components that are bundled and tested in this top-level module.

If you want to read or contribute to the source-code you can get to it in the individual repos.

### Core Components

- [**server**](https://github.com/hoodiehq/hoodie-server)
- [**client**](https://github.com/hoodiehq/hoodie.js)
- [**admin-dashboard**](https://github.com/hoodiehq/hoodie-admin-dashboard)

### Core Plugins

- [**plugin-appconfig**](https://github.com/hoodiehq/hoodie-plugin-appconfig)
- [**plugin-email**](https://github.com/hoodiehq/hoodie-plugin-email)
- [**plugin-users**](https://github.com/hoodiehq/hoodie-plugin-users)

## Development

Please note that you need to run a Selenium Standalone Server if you're running the tests locally. You can download it on the [project's website](http://www.seleniumhq.org/download/).

`java -jar selenium-server-standalone-2.46.0.jar`

Once Selenium is running you can execute `npm test` in another terminal tab.

## License

[Apache 2.0](LICENSE)
