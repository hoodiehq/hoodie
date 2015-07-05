<a name"2.1.1"></a>
### 2.1.1 (2015-07-05)


#### Bug Fixes

* pass state when restarting pull request ([4f3d48ca](https://github.com/hoodiehq/hoodie.js/commit/4f3d48ca))


<a name"2.1.0"></a>
## 2.1.0 (2015-06-29)


#### Bug Fixes

* restart pull request correctly ([aa8fc3a1](https://github.com/hoodiehq/hoodie.js/commit/aa8fc3a1))


#### Features

* force gzip for bootstrapping #423 ([778ec026](https://github.com/hoodiehq/hoodie.js/commit/778ec026))


<a name="2.0.4"></a>
### 2.0.4 (2015-03-01)


#### Bug Fixes

* hoodie.checkConnection() to reject on error ([07dd7c4d](https://github.com/hoodiehq/hoodie.js/commit/07dd7c4d096bf3c988c59dac013957bf72e77cf2))
* move data on username change (jup, again) ([a35297d9](https://github.com/hoodiehq/hoodie.js/commit/a35297d9a1201e37012d08bd78df220c4bfcb9ac))
* move data on username change ([0b985335](https://github.com/hoodiehq/hoodie.js/commit/0b98533550d8c18825d9aeb1c3510ed77dcd0874))


<a name="2.0.3"></a>
### 2.0.3 (2015-02-26)


#### Bug Fixes

* another "Unhandled rejection error" (#418) ([fe83398b](https://github.com/hoodiehq/hoodie.js/commit/fe83398b2c8ee86b58acdcaa08711234ad1d8016))


<a name="2.0.2"></a>
### 2.0.2 (2015-02-23)


#### Bug Fixes

* utils.localStorageWrapper.clear() is undefined (#415) ([9eb55339](https://github.com/hoodiehq/hoodie.js/commit/9eb553399b7f88e2fd0e5619bebf04c330c01417))


<a name="2.0.1"></a>
### 2.0.1 (2015-02-21)


#### Bug Fixes

* fallback to normal signUp routine when upgrade from anonymous account fails with ([9fb0d28b](https://github.com/hoodiehq/hoodie.js/commit/9fb0d28be5ebe407f88e10952d8a712fc99aa973))


<a name="2.0.0"></a>
## 2.0.0 (2015-02-19)


#### Breaking Changes

* 
The hoodie id is now expected to be in localStorage `_hoodieId`
key, the deprecated `_account.ownerHash` key is no longer working.

The order of triggered events with type prefix is
`<type>:<id>:<eventname>`. The deprecated order
`<eventname>:<type>:<id>` is no longer working.

See https://github.com/hoodiehq/hoodie.js/issues/146
and https://github.com/hoodiehq/hoodie.js/issues/326

* * *

This commit was sponsored by The Hoodie Firm.
You can hire The Hoodie Firm:

http://go.hood.ie/thehoodiefirm
 ([54987289](https://github.com/hoodiehq/hoodie.js/commit/549872894bc0fecfa5e61dc5650699f4c60214d7))


<a name="1.0.6"></a>
### 1.0.6 (2015-02-18)


#### Bug Fixes

* silents "unhandled rejected promises" (#402) ([171cb568](https://github.com/hoodiehq/hoodie.js/commit/171cb568aac39aa360abc2abb4acbfd01d581037))
* ignore _design docs ([f335e5ec](https://github.com/hoodiehq/hoodie.js/commit/f335e5ecd7bf91c8c2a03638499e6dbed4ea9ab0))
* **account:** reject password change when current password is wrong ([596e8156](https://github.com/hoodiehq/hoodie.js/commit/596e8156428077b53975ea4a47cbc4d46a11193c), closes [#103](https://github.com/hoodiehq/hoodie.js/issues/103))


<a name="1.0.4"></a>
### 1.0.4 (2015-02-17)


#### Bug Fixes

* promise handling ([7072d10c](https://github.com/hoodiehq/hoodie.js/commit/7072d10caa47c465e26f2d326ef0ccf13025c734))
* avoid getters/setters having the same name as variables used inside ([7bac63a7](https://github.com/hoodiehq/hoodie.js/commit/7bac63a764458c0c126a4554828cc96ad9fac32c))
* avoid "Unhandled promise rejection" when pulling changes (#402) ([39ec4874](https://github.com/hoodiehq/hoodie.js/commit/39ec4874f222d0854a285c1ebf20a92d52fc457d))
* **account:** fix hoodie.account.resetPassword() ([0ba2f194](https://github.com/hoodiehq/hoodie.js/commit/0ba2f194963e7df29fec32725c612b3d81e47029), closes [#410](https://github.com/hoodiehq/hoodie.js/issues/410))


<a name="1.0.3"></a>
### 1.0.3 (2015-01-29)


#### Bug Fixes

* handle unhandled rejected promises (#402) ([f319c72e](https://github.com/hoodiehq/hoodie.js/commit/f319c72e277840740b821e20589a2abc480d378f))


<a name="1.0.1"></a>
### 1.0.1 (2015-01-23)


#### Bug Fixes

* jshint errors ([b899f159](https://github.com/hoodiehq/hoodie.js/commit/b899f1594c12bec99a36848bfc8ee2749d931f0c))
* hoodie.account.signIn() should not trigger 'signin' if it also triggers 'reauthe ([eec2a87e](https://github.com/hoodiehq/hoodie.js/commit/eec2a87e3ef5630622a68c1a64a9472d24afa2cd))
* hoodie.account.anonymousSignUp() should not resolve with anonymous username #368 ([8fd7cf10](https://github.com/hoodiehq/hoodie.js/commit/8fd7cf10af509974929292d238750b2090445842))
* hoodie.account.destory() should trigger destroy event and pass username #367 ([1c4b3f5f](https://github.com/hoodiehq/hoodie.js/commit/1c4b3f5f309684a08b97a637d2a3be2972944a2d))
* hoodie.account.destory() should resolve with username #366 ([d7d19ce4](https://github.com/hoodiehq/hoodie.js/commit/d7d19ce4d35bb979b36b39bdfb66a307c6e1aba5))
* hoodie.account.signOut() should resolve with username #365 ([c15fc9c3](https://github.com/hoodiehq/hoodie.js/commit/c15fc9c3429025625e92236f2b71b54a4aeb72f4))
* hoodie.account.changePassword() should resolve without arguments #364 ([7aa7fa7d](https://github.com/hoodiehq/hoodie.js/commit/7aa7fa7dc519b332c0cc9f7c50ef169275fc9443))
* tell rules in object.type Error #241 ([a8044148](https://github.com/hoodiehq/hoodie.js/commit/a8044148181d29e2ed2fb87e6ff4fad34964104d))
* wrap `promise.catch` to pass custom callbacks ([b2997bd2](https://github.com/hoodiehq/hoodie.js/commit/b2997bd2b1233832767d1ce4e294409ae3686ca5))
* throw errors in event handlers on next tick #376 ([198bf4ac](https://github.com/hoodiehq/hoodie.js/commit/198bf4ac30429603be13018530c69ed23cf831ed))
* hoodie.open(dbName).disconnect() to return promise #363 ([e055dd46](https://github.com/hoodiehq/hoodie.js/commit/e055dd46cd1e2585be0ccd86797293ed3c38aca3))
* make sure promises get wrapped with Hoodie-specific callbacks ([8ef5cea3](https://github.com/hoodiehq/hoodie.js/commit/8ef5cea3f974feaf3866ed2ced6b8713c5b33b9d))
* avoid Getters / Setters handling variables with same names ([654c855a](https://github.com/hoodiehq/hoodie.js/commit/654c855a25f0d80b2b83e16a5580d2cb5e61ad6d))
* Prevent multiple connects from resulting in conflicting calls to remote.push ([5830dfd9](https://github.com/hoodiehq/hoodie.js/commit/5830dfd9f1a40f8c112f9c9ad4c79e15321df3a3))
* hoodie.account unauthenticated handling ([3b52036c](https://github.com/hoodiehq/hoodie.js/commit/3b52036cb3037c5482450f73936dfd2d1e83ee60))
* hoodie.account.signUp (from anonymous account) ([e827f3a7](https://github.com/hoodiehq/hoodie.js/commit/e827f3a7e338535ea6f57f0e52ab77770e178157))
* hoodie.account.destroy ([1906cf6f](https://github.com/hoodiehq/hoodie.js/commit/1906cf6f7d83ae2b57d9e685fc83bb5d898c61cf))
* hoodie.account.changeUsername ([918095e0](https://github.com/hoodiehq/hoodie.js/commit/918095e063da2042b2efc1d39847c3ca0958ef60))
* hoodie.account.changePassword() state foo ([ef012dbc](https://github.com/hoodiehq/hoodie.js/commit/ef012dbce46a507f3205256d7d65425e81f95e6c))
* hoodie.account.signIn() to return promise ([c48b4f0a](https://github.com/hoodiehq/hoodie.js/commit/c48b4f0a1e76134d1901ee6270c9ee0598d4308f))
* **account:**
  * set `hoodie.account.username` on initialization. ([0ff6f725](https://github.com/hoodiehq/hoodie.js/commit/0ff6f72572e39ea4d07138912aa69e6cc56c7c76))
  * adding bearer token handling (again) ([c0b72286](https://github.com/hoodiehq/hoodie.js/commit/c0b722864eacf045f84a61e6ac2a4535638af66d))
* **erro:** typo ([a93c2090](https://github.com/hoodiehq/hoodie.js/commit/a93c20909fd13b130e846bb48fb44a206379d37e))
* **jshint:** ; <3 ([82039219](https://github.com/hoodiehq/hoodie.js/commit/820392197c707e07767bd1cff748a15ae6fdc56a))
* **open:**
  * add timestamps and user id to objects (#361) ([d01fb3c8](https://github.com/hoodiehq/hoodie.js/commit/d01fb3c882613fc51e1c6e1e7aaf9ca2bb8ea9f6))
  * hoodie.open(dbName).add(test, {}) does not resolve with created object #361 ([bc537714](https://github.com/hoodiehq/hoodie.js/commit/bc53771469f5a37a0d610a819c84dfed32e9006f))
* **promise:**
  * fix internal `.then(null, handler)` handling, fixes #392 ([f7795ce7](https://github.com/hoodiehq/hoodie.js/commit/f7795ce7e5aee402e82fe45afcd679159f90f0da))
  * pass progress callbacks on `.then`ing ([ac368b49](https://github.com/hoodiehq/hoodie.js/commit/ac368b4953f8ba6cf3bea84a4347ac238fbb437e))
* **store:**
  * hoodie.store.removeAll() resolves with array of promises, not the objects #380 ([75565a01](https://github.com/hoodiehq/hoodie.js/commit/75565a01923f96d87111c15d334716a0d758d19d))
  * hoodie.store.updateAll() resolves with array of promises, not the objects #379 ([840eb4eb](https://github.com/hoodiehq/hoodie.js/commit/840eb4eb4659e8f2a7b0396590bc032dcb6742bf))
  * find("unknown", "123") to reject tell type & id in NotFound error message ([37eabe4e](https://github.com/hoodiehq/hoodie.js/commit/37eabe4ec141acbd26b9b5e6f7df38d19e40f196))
  * fail with ConflictHerror when adding object with existing type/id #377 ([aa48a211](https://github.com/hoodiehq/hoodie.js/commit/aa48a2116b8d77684cf0d0b549595371be63c5cb))
* **task:**
  * do not pass progress of hoodie.account.anonymousSignUp (#372) ([f6733571](https://github.com/hoodiehq/hoodie.js/commit/f67335717d8eb63a5dd5a31003cf1ef4e7f2b5b9))
  * call `.progress` callback on `hoodie.task.start` ([ad0a5260](https://github.com/hoodiehq/hoodie.js/commit/ad0a52609981ec4971634dd0d0cc6c239a7482e7))


#### Features

* CheatSheet ([990723bf](https://github.com/hoodiehq/hoodie.js/commit/990723bfd347fae9eacfd930716965e4eaa3ae7c))


<a name="1.0.0"></a>
## 1.0.0 (2014-10-08)


<a name="1.0.0-beta.2"></a>
### 1.0.0-beta.2 (2014-10-08)


#### Bug Fixes

* hoodie.account.signUp() should call .progress when coming from an anonymous acco ([c770f59f](https://github.com/hoodiehq/hoodie.js/commit/c770f59f6f0dcbd43e848cee64366bf1c47450a5))


<a name="0.9.7"></a>
### 0.9.7 (2014-07-02)


#### Bug Fixes

* hoodie.store.updateAll to resolve with array of updated objects ([dff493ec](https://github.com/hoodiehq/hoodie.js/commit/dff493ec992e77b6a0c4fab69113e0efa64abedc))


#### Features

* **hoodie.store:** allow dashes in type names ([0764e83d](https://github.com/hoodiehq/hoodie.js/commit/0764e83d74264cfc67f06297ae4274b125a35f5d), closes [#296](https://github.com/hoodiehq/hoodie.js/issues/296))


<a name="0.9.6"></a>
### 0.9.6 (2014-06-10)


#### Bug Fixes

* **remote:** trigger doc:change, not change:doc ([355bd064](https://github.com/hoodiehq/hoodie.js/commit/355bd0642185c517647fff3564cc3723a8baa223))


<a name="0.9.5"></a>
### 0.9.5 (2014-06-10)


#### Bug Fixes

* **store:** when object removed from remote, remove it locally instead of marking as _delete ([bcd656fe](https://github.com/hoodiehq/hoodie.js/commit/bcd656fe959e6e8c842c7e13d81ba864cc570170))
* **utils:** fixed store.getObject / store.setObject behaviour ([a4102a69](https://github.com/hoodiehq/hoodie.js/commit/a4102a69db2f917b7db282d34c7b45a87888acec))


<a name="0.9.4"></a>
### 0.9.4 (2014-06-06)


#### Bug Fixes

* **account:** signin in from anonymous account now moves data correctly ([914dd515](https://github.com/hoodiehq/hoodie.js/commit/914dd515ee80fedda8afe92bffa1ff0b9437f3e5))


<a name="0.9.3"></a>
### 0.9.3 (2014-06-06)


#### Bug Fixes

* **sync:** trigger remove events for completed tasks ([a2d94fa8](https://github.com/hoodiehq/hoodie.js/commit/a2d94fa88c90669d2aee8998d8840a710d919781))


<a name="0.9.2"></a>
### 0.9.2 (2014-06-05)


#### Bug Fixes

* **account:** hoodie.account.signUp() to persist username ([5d58bf08](https://github.com/hoodiehq/hoodie.js/commit/5d58bf088159d907473151073580c5ec7cc2845d))
* **hoodie:** pass lib & utils to hoodie.extend callback ([92cc90e8](https://github.com/hoodiehq/hoodie.js/commit/92cc90e8c1be7cca3cd882ab201e6cd5babaabfe))


#### Features

* **account:** 'passwordreset' events now pass username ([3048451c](https://github.com/hoodiehq/hoodie.js/commit/3048451cf4517fcf0f193d31e3af72cd09af15c6))


<a name="0.9.1"></a>
### 0.9.1 (2014-05-28)


#### Bug Fixes

* **hoodie.task:** triggers 'success' event right before 'error' ([cc54ab22](https://github.com/hoodiehq/hoodie.js/commit/cc54ab22f04ebb3460edf8dd87c2990f802912e5))


#### Features

* **hoodie.account:** pass username on signout event ([d196e50c](https://github.com/hoodiehq/hoodie.js/commit/d196e50c62371015b9ec4d031e4824b721073adb))


<a name="0.9.0"></a>
## 0.9.0 (2014-05-28)


#### Bug Fixes

* **account:** do not set hoodie.account.username for anonymous accounts ([f2a6b61f](https://github.com/hoodiehq/hoodie.js/commit/f2a6b61fbaddc8c6be6fe3f78d1216ea84cb5f93))
* **test:** removing forgotten describe.only statement ([8fa6cca4](https://github.com/hoodiehq/hoodie.js/commit/8fa6cca4c78ad18c110d14b07e02c01e7a77e1ed))


<a name="0.8.3"></a>
### 0.8.3 (2014-05-24)


#### Bug Fixes

* **account:** call hoodie.account.subscribeToOutsideEvents in Hoodie constructor ([210a1eca](https://github.com/hoodiehq/hoodie.js/commit/210a1eca1f20152ee972c7cd9da4b79527fb4785))


