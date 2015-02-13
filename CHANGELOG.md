<a name="2.1.2"></a>
### 2.1.2 (2015-02-13)


<a name="2.1.0"></a>
## 2.1.0 (2015-02-12)


#### Bug Fixes

* **api:** Debug: hapi, internal, implementation, error (#322) ([cdf2caac](https://github.com/hoodiehq/hoodie-server/commit/cdf2caac0d7338736dec39f44cca2304b9e22ab1))
* **tests:** check for buffers ([c9ec210d](https://github.com/hoodiehq/hoodie-server/commit/c9ec210d13d2771925bc42fc062bcb218538dd7b))


#### Features

* updated hoodie.js to 0.9.2 ([1a3e54e9](https://github.com/hoodiehq/hoodie-server/commit/1a3e54e9f7a4c7fb3731040dc50e08f8831ac426))


<a name="2.0.1"></a>
### 2.0.1 (2015-01-18)


#### Bug Fixes

* **admin:** update to changes in request API ([8ab9547d](https://github.com/hoodiehq/hoodie-server/commit/8ab9547d65fbdcd5decc434e8ae9f18f9e85c4c7))
* **bearertoken:** send correct content-length header ([a46625c5](https://github.com/hoodiehq/hoodie-server/commit/a46625c5234299fecb0a6b4c0bee3e53e258a5ac))
* **proxy:** set proxy target hostname to avoid SSL errors ([1d353d98](https://github.com/hoodiehq/hoodie-server/commit/1d353d98a2ec6fa26bbdce9f63217ca4888f8bd4))
* **test:**
  * hapi chomps newlines, we like newlines ([1d6d373e](https://github.com/hoodiehq/hoodie-server/commit/1d6d373e82c8266cd6f0a283ad4dc1bb1c8f4fc2))
  * use Wreck in test suite ([98f5b64d](https://github.com/hoodiehq/hoodie-server/commit/98f5b64d1319bc90824a611a7da57cf632efa469))
  * hapi chomps newlines, we like newlines ([cf9a6bb5](https://github.com/hoodiehq/hoodie-server/commit/cf9a6bb5c890e6c3568d78f87ecb524acdc8a399))
  * use Wreck in test suite ([252c402e](https://github.com/hoodiehq/hoodie-server/commit/252c402e8e2f518e603826ace7653048821c8af8))
* **tests:** increase timeouts ([da770dea](https://github.com/hoodiehq/hoodie-server/commit/da770dea55850939cedbaf3ae64913453f40380f))


<a name="2.0.0"></a>
## 2.0.0 (2014-10-08)


<a name="2.0.0-beta.1"></a>
## 2.0.0-beta.1 (2014-10-08)


#### Bug Fixes

* **assets:** re-rename pocket->admin-dashboard ([2dc50428](https://github.com/hoodiehq/hoodie-server/commit/2dc50428fc846bf0405b383fcf064fd1cab9b276))
* **cors:** make all headers lowercase, otherwise hapi will overwrite them ([8978e3fa](https://github.com/hoodiehq/hoodie-server/commit/8978e3fae1a2e2f85369fce138497aaf6a9e87b9))
* **test:** hapi chomps newlines, we like newlines ([97d621f6](https://github.com/hoodiehq/hoodie-server/commit/97d621f6a426898d4ae34b6e2713a52ff4729066))

BREAKING CHANGE:

depends on hoodie > 1.0.0-beta.1 || 1.0.0 for bearer token compatibility


<a name="1.3.0"></a>
## 1.3.0 (2014-09-17)


#### Features

* **hapi:** upgrade to latest ([98e805df](https://github.com/hoodiehq/hoodie-server/commit/98e805dfa38fd80e5281b7e4c85502bb899a21e3))
* **requests:** allow request sizes up to 10 MB ([36d4ecba](https://github.com/hoodiehq/hoodie-server/commit/36d4ecbaef2b3c68e711da7dd4a30ed37840133c))


<a name="1.2.4"></a>
### 1.2.4 (2014-08-07)


<a name="1.2.3"></a>
### 1.2.3 (2014-08-06)


#### Bug Fixes

* **api:** return 404 for /_api/_all_dbs ([8ecdafde](https://github.com/hoodiehq/hoodie-server/commit/8ecdafde81629d2d8a0dc134f95da24064d5706d))


<a name="1.2.2"></a>
### 1.2.2 (2014-07-24)


#### Features

* **hapi:** upgrade hapi to version 6 ([487a32b9](https://github.com/hoodiehq/hoodie-server/commit/487a32b954c7f03bd1e87264ab052c891ca82239))


<a name="1.2.1"></a>
### 1.2.1 (2014-07-24)


#### Bug Fixes

* **data_path:** fix lost data_path commits ([9fc6fc70](https://github.com/hoodiehq/hoodie-server/commit/9fc6fc70a8f9ca45f038104cd44409688a1c9a69))


<a name="1.2.0"></a>
## 1.2.0 (2014-07-24)


#### Bug Fixes

* **config:** only show config location once ([aa342d21](https://github.com/hoodiehq/hoodie-server/commit/aa342d213342d49aae9285dab48e33e4a86519c7))
* **environment:** consolidate cfg / config/ env variables inside hoodie server. #294 ([2a91c593](https://github.com/hoodiehq/hoodie-server/commit/2a91c593afb7fcd63330fb679a4cd75852a3247b))
* **jshint:** fix errors ([7b149aef](https://github.com/hoodiehq/hoodie-server/commit/7b149aef4f8b7a92cf4f1a6c94bf3e9d58262f7d))


#### Features

* **logging:** adds verbose argument ([694644ae](https://github.com/hoodiehq/hoodie-server/commit/694644aef025d897f5c1e299c107cf4062942f6e))


<a name="1.1.2"></a>
### 1.1.2 (2014-07-23)


#### Features

* **config:** log where config is read from ([f9e72aac](https://github.com/hoodiehq/hoodie-server/commit/f9e72aacc0cf0d42c149eb586f0e2c1c4663ef01), closes [#69](https://github.com/hoodiehq/hoodie-server/issues/69))


<a name="1.1.1"></a>
### 1.1.1 (2014-07-17)


#### Bug Fixes

* **custom-ports:** unify on `custom-ports` ([5bb8865a](https://github.com/hoodiehq/hoodie-server/commit/5bb8865a768f0052d223a50e4ed27f6763a69338))


<a name="1.1.0"></a>
## 1.1.0 (2014-07-17)


#### Bug Fixes

* **environment:** Change `custom_ports` option to `custom-ports` as descibed in help. ([e4f0ec53](https://github.com/hoodiehq/hoodie-server/commit/e4f0ec5375d844b936b6dbc7d176368c1442192a))
* **options:** reverse order of custom ports arguments ([e76b8493](https://github.com/hoodiehq/hoodie-server/commit/e76b849371bb9a154ec08dc79803e36f502c8763))


#### Features

* **environment:** Permit users to specify custom ports with hoodie start --custom-ports 1111,2222, ([796105c2](https://github.com/hoodiehq/hoodie-server/commit/796105c2388a83a68aeb7a4b286d76399fd59b99))


<a name="1.0.0"></a>
## 1.0.0 (2014-07-14)


<a name="0.9.32"></a>
### 0.9.32 (2014-07-14)


<a name="0.9.31"></a>
### 0.9.31 (2014-07-14)


<a name="0.9.29"></a>
### 0.9.29 (2014-06-06)


<a name="0.9.28"></a>
### 0.9.28 (2014-06-05)


#### Features

* updated hoodie.js to 0.9.2 ([1a3e54e9](https://github.com/hoodiehq/hoodie-server/commit/1a3e54e9f7a4c7fb3731040dc50e08f8831ac426))


