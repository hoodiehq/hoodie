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

`npm install --save hoodie@next`

_Note_: This is still a developer preview. Look at [Hoodie’s new Tracker App](https://github.com/hoodiehq/hoodie-app-tracker) to get the current stable Hoodie install.

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

## Why is there no code in this repository?

Hoodie consists of three main components that are integrated and tested altogether in this top-level module.

1. [**client**](https://github.com/hoodiehq/hoodie-client)  
   Hoodie’s front-end client for the browser. It integrates the following client modules:
   1. [client-account](https://github.com/hoodiehq/hoodie-client-account)  
   2. [client-store](https://github.com/hoodiehq/hoodie-client-store)  
   3. [client-task](https://github.com/hoodiehq/hoodie-client-task)  
   4. [client-log](https://github.com/hoodiehq/hoodie-client-log)  
   5. [client-connection-status](https://github.com/hoodiehq/hoodie-client-connection-status)  


2. [**server**](https://github.com/hoodiehq/hoodie-server)  
   Hoodie’s back-end. It integrates the following hapi plugins:
   1. [server-account](https://github.com/hoodiehq/hoodie-server-account)
   2. [server-store](https://github.com/hoodiehq/hoodie-server-store)
   3. [server-task](https://github.com/hoodiehq/hoodie-server-task)


3. [**admin-dashboard**](https://github.com/hoodiehq/hoodie-admin-dashboard)  
   Hoodie’s built-in admin dashboard web application


## License

[Apache 2.0](LICENSE)
