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


