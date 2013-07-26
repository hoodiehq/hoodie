// Remote
// ========

// Connection to a remote Couch Database.
//
// store API
// ----------------
//
// object loading / updating / deleting
//
// * find(type, id)
// * findAll(type )
// * add(type, object)
// * save(type, id, object)
// * update(type, id, new_properties )
// * updateAll( type, new_properties)
// * remove(type, id)
// * removeAll(type)
//
// custom requests
//
// * request(view, params)
// * get(view, params)
// * post(view, params)
//
// synchronization
//
// * connect()
// * disconnect()
// * pull()
// * push()
// * sync()
//
// event binding
//
// * on(event, callback)
//

//
var ConnectionError;

Hoodie.Remote = (function(_super) {

  'use strict';

  // Constructor
  // -------------

  // sets name (think: namespace) and some other options
  function Remote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};

    this._handlePullResults = this._handlePullResults.bind(this);
    this._handlePullError = this._handlePullError.bind(this);
    this._handlePullSuccess = this._handlePullSuccess.bind(this);
    this._restartPullRequest = this._restartPullRequest.bind(this);
    this._mapDocsFromFindAll = this._mapDocsFromFindAll.bind(this);
    this._parseAllFromRemote = this._parseAllFromRemote.bind(this);
    this._parseFromRemote = this._parseFromRemote.bind(this);
    this.sync = this.sync.bind(this);
    this.push = this.push.bind(this);
    this.pull = this.pull.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.connect = this.connect.bind(this);

    if (options.name !== undefined) {
      this.name = options.name;
    }

    if (options.prefix !== undefined) {
      this.prefix = options.prefix;
    }

    if (options.connected !== undefined) {
      this.connected = options.connected;
    }

    if (options.baseUrl !== null) {
      this.baseUrl = options.baseUrl;
    }

    // in order to differentiate whether an object from remote should trigger a 'new'
    // or an 'update' event, we store a hash of known objects
    this._knownObjects = {};

    if (this.isConnected()) {
      this.connect();
    }
  }

  Object.deepExtend(Remote, _super);


  // properties
  // ------------

  // name

  // the name of the Remote is the name of the
  // CouchDB database and is also used to prefix
  // triggered events
  //
  Remote.prototype.name = null;


  // sync

  // if set to true, updates will be continuously pulled
  // and pushed. Alternatively, `sync` can be set to
  // `pull: true` or `push: true`.
  //
  Remote.prototype.connected = false;


  // prefix

  //prefix for docs in a CouchDB database, e.g. all docs
  // in public user stores are prefixed by '$public/'
  //
  Remote.prototype.prefix = '';


  // request
  // ---------

  // wrapper for hoodie.request, with some store specific defaults
  // and a prefixed path
  //
  Remote.prototype.request = function(type, path, options) {
    options = options || {};

    if (this.name) {
      path = "/" + (encodeURIComponent(this.name)) + path;
    }

    if (this.baseUrl) {
      path = "" + this.baseUrl + path;
    }

    options.contentType = options.contentType || 'application/json';

    if (type === 'POST' || type === 'PUT') {
      options.dataType = options.dataType || 'json';
      options.processData = options.processData || false;
      options.data = JSON.stringify(options.data);
    }
    return this.hoodie.request(type, path, options);
  };


  // get
  // -----

  // send a GET request to the named view
  //
  Remote.prototype.get = function() {
    return console.log.apply(
      console, [".get() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };


  // post
  // ------

  // sends a POST request to the specified updated_function
  //
  Remote.prototype.post = function() {
    return console.log.apply(
      console, [".post() not yet implemented"]
      .concat(Array.prototype.slice.call(arguments))
    );
  };


  // Store Operations overides
  // ---------------------------

  // find
  // ------

  // find one object
  //
  Remote.prototype.find = function(type, id) {
    var defer, path;

    defer = Remote.__super__.find.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return defer;
    }

    path = "" + type + "/" + id;

    if (this.prefix) {
      path = this.prefix + path;
    }

    path = "/" + encodeURIComponent(path);

    return this.request("GET", path).pipe(this._parseFromRemote);
  };


  // findAll
  // ---------

  // find all objects, can be filetered by a type
  //
  Remote.prototype.findAll = function(type) {
    var defer, endkey, path, startkey;

    defer = Remote.__super__.findAll.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return defer;
    }

    path = "/_all_docs?include_docs=true";

    switch (true) {
    case (type !== undefined) && this.prefix !== '':
      startkey = "" + this.prefix + type + "/";
      break;
    case type !== undefined:
      startkey = "" + type + "/";
      break;
    case this.prefix !== '':
      startkey = this.prefix;
      break;
    default:
      startkey = '';
    }

    if (startkey) {

      // make sure that only objects starting with
      // `startkey` will be returned
      endkey = startkey.replace(/.$/, function(chars) {
        var charCode;
        charCode = chars.charCodeAt(0);
        return String.fromCharCode(charCode + 1);
      });
      path = "" + path + "&startkey=\"" + (encodeURIComponent(startkey)) + "\"&endkey=\"" + (encodeURIComponent(endkey)) + "\"";
    }
    return this.request("GET", path).pipe(this._mapDocsFromFindAll).pipe(this._parseAllFromRemote);
  };


  // save
  // ------

  // save a new object. If it existed before, all properties
  // will be overwritten
  //
  Remote.prototype.save = function(type, id, object) {
    var defer, path;
    defer = Remote.__super__.save.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    if (!id) {
      id = this.hoodie.uuid();
    }
    object = $.extend({
      type: type,
      id: id
    }, object);
    object = this._parseForRemote(object);
    path = "/" + encodeURIComponent(object._id);
    return this.request("PUT", path, {
      data: object
    });
  };


  // remove
  // ---------

  // remove one object
  //
  Remote.prototype.remove = function(type, id) {
    return this.update(type, id, {
      _deleted: true
    });
  };


  // removeAll
  // ------------

  // remove all objects, can be filtered by type
  //
  Remote.prototype.removeAll = function(type) {
    return this.updateAll(type, {
      _deleted: true
    });
  };


  // isKnownObject
  // ---------------

  // determine between a known and a new object
  //
  Remote.prototype.isKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;

    if (this._knownObjects[key] !== undefined) {
      return this._knownObjects[key];
    }
  };


  // markAsKnownObject
  // -------------------

  // determine between a known and a new object
  //
  Remote.prototype.markAsKnownObject = function(object) {
    var key = "" + object.type + "/" + object.id;
    this._knownObjects[key] = 1;
    return this._knownObjects[key];
  };


  // synchronization
  // -----------------

  // Connect
  // ---------

  // start syncing. `this.bootstrap()` will automatically start
  // pulling when `this.connected` remains true.
  //
  Remote.prototype.connect = function() {
    this.connected = true;
    return this.bootstrap();
  };


  // Disconnect
  // ------------

  // stop syncing changes from remote store
  //
  Remote.prototype.disconnect = function() {
    this.connected = false;

    if (this._pullRequest !== undefined) {
      this._pullRequest.abort();
    }

    if (this._pushRequest !== undefined) {
      this._pushRequest.abort();
    }

  };


  // isConnected
  // -------------

  //
  Remote.prototype.isConnected = function() {
    return this.connected;
  };


  // getSinceNr
  // ------------

  // returns the sequence number from wich to start to find changes in pull
  //
  Remote.prototype.getSinceNr = function() {
    return this._since || 0;
  };


  // setSinceNr
  // ------------

  // sets the sequence number from wich to start to find changes in pull
  //
  Remote.prototype.setSinceNr = function(seq) {
    this._since = seq;
    return this._since;
  };


  // bootstrap
  // -----------

  // inital pull of data of the remote start. By default, we pull all
  // changes since the beginning, but this behavior might be adjusted,
  // e.g for a filtered bootstrap.
  //
  Remote.prototype.bootstrap = function() {
    this.trigger('bootstrap:start');
    return this.pull().done( this._handleBootstrapSuccess.bind(this) );
  };


  // pull changes
  // --------------

  // a.k.a. make a GET request to CouchDB's `_changes` feed.
  // We currently make long poll requests, that we manually abort
  // and restart each 25 seconds.
  //
  Remote.prototype.pull = function() {
    this._pullRequest = this.request('GET', this._pullUrl());

    if (this.isConnected()) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }

    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };


  // push changes
  // --------------

  // Push objects to remote store using the `_bulk_docs` API.
  //
  Remote.prototype.push = function(objects) {
    var object, objectsForRemote, _i, _len;

    if (!(objects !== undefined ? objects.length : void 0)) {
      return this.hoodie.resolveWith([]);
    }

    objectsForRemote = [];

    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      this._addRevisionTo(object);
      object = this._parseForRemote(object);
      objectsForRemote.push(object);
    }
    this._pushRequest = this.request('POST', "/_bulk_docs", {
      data: {
        docs: objectsForRemote,
        new_edits: false
      }
    });

    return this._pushRequest;
  };

  // sync changes
  // --------------

  // push objects, then pull updates.
  //
  Remote.prototype.sync = function(objects) {
    return this.push(objects).pipe(this.pull);
  };


  // Events
  // --------

  // namespaced alias for `hoodie.on`
  //
  Remote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.on(event, cb);
  };

  Remote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.one(event, cb);
  };


  // namespaced alias for `hoodie.trigger`
  //
  Remote.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["" + this.name + ":" + event].concat(Array.prototype.slice.call(parameters)));
  };


  // Private
  // --------------

  // valid CouchDB doc attributes starting with an underscore
  //
  Remote.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


  // Parse for remote
  // ------------------

  // parse object for remote storage. All properties starting with an
  // `underscore` do not get synchronized despite the special properties
  // `_id`, `_rev` and `_deleted` (see above)
  //
  // Also `id` gets replaced with `_id` which consists of type & id
  //
  Remote.prototype._parseForRemote = function(object) {
    var attr, properties;
    properties = $.extend({}, object);

    for (attr in properties) {
      if (properties.hasOwnProperty(attr)) {
        if (this._validSpecialAttributes.indexOf(attr) !== -1) {
          continue;
        }
        if (!/^_/.test(attr)) {
          continue;
        }
        delete properties[attr];
      }
    }

    // prepare CouchDB id
    properties._id = "" + properties.type + "/" + properties.id;
    if (this.prefix) {
      properties._id = "" + this.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  };


  // ### _parseFromRemote

  // normalize objects coming from remote
  //
  // renames `_id` attribute to `id` and removes the type from the id,
  // e.g. `type/123` -> `123`
  //
  Remote.prototype._parseFromRemote = function(object) {
    var id, ignore, _ref;

    // handle id and type
    id = object._id || object.id;
    delete object._id;

    if (this.prefix) {
      id = id.replace(new RegExp('^' + this.prefix), '');
    }

    // turn doc/123 into type = doc & id = 123
    // NOTE: we don't use a simple id.split(/\//) here,
    // as in some cases IDs might contain "/", too
    //
    _ref = id.match(/([^\/]+)\/(.*)/),
    ignore = _ref[0],
    object.type = _ref[1],
    object.id = _ref[2];

    return object;
  };

  Remote.prototype._parseAllFromRemote = function(objects) {
    var object, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      _results.push(this._parseFromRemote(object));
    }
    return _results;
  };


  // ### _addRevisionTo

  // extends passed object with a _rev property
  //
  Remote.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/),
      currentRevNr = _ref[0],
      currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = this._generateNewRevisionId();

    // local changes are not meant to be replicated outside of the
    // users database, therefore the `-local` suffix.
    if (attributes._$local) {
      newRevisionId += "-local";
    }

    attributes._rev = "" + (currentRevNr + 1) + "-" + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };

    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  };


  // ### generate new revision id

  //
  Remote.prototype._generateNewRevisionId = function() {
    return this.hoodie.uuid(9);
  };


  // ### map docs from findAll

  //
  Remote.prototype._mapDocsFromFindAll = function(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  };


  // ### pull url

  // Depending on whether remote is connected, return a longpoll URL or not
  //
  Remote.prototype._pullUrl = function() {
    var since;
    since = this.getSinceNr();
    if (this.isConnected()) {
      return "/_changes?include_docs=true&since=" + since + "&heartbeat=10000&feed=longpoll";
    } else {
      return "/_changes?include_docs=true&since=" + since;
    }
  };


  // ### restart pull request

  // request gets restarted automaticcally
  // when aborted (see @_handlePullError)
  Remote.prototype._restartPullRequest = function() {
    if (this._pullRequest) {
      this._pullRequest.abort();
    }
  };


  // ### pull success handler

  // request gets restarted automaticcally
  // when aborted (see @_handlePullError)
  //
  Remote.prototype._handlePullSuccess = function(response) {
    this.setSinceNr(response.last_seq);
    this._handlePullResults(response.results);
    if (this.isConnected()) {
      return this.pull();
    }
  };


  // ### pull error handler

  // when there is a change, trigger event,
  // then check for another change
  //
  Remote.prototype._handlePullError = function(xhr, error) {
    if (!this.isConnected()) {
      return;
    }

    switch (xhr.status) {
      // Session is invalid. User is still login, but needs to reauthenticate
      // before sync can be continued
    case 401:
      this.trigger('error:unauthenticated', error);
      return this.disconnect();

     // the 404 comes, when the requested DB has been removed
     // or does not exist yet.
     //
     // BUT: it might also happen that the background workers did
     //      not create a pending database yet. Therefore,
     //      we try it again in 3 seconds
     //
     // TODO: review / rethink that.
     //

    case 404:
      return window.setTimeout(this.pull, 3000);

    case 500:
      //
      // Please server, don't give us these. At least not persistently
      //
      this.trigger('error:server', error);
      window.setTimeout(this.pull, 3000);
      return this.hoodie.checkConnection();
    default:
      // usually a 0, which stands for timeout or server not reachable.
      if (xhr.statusText === 'abort') {
        // manual abort after 25sec. restart pulling changes directly when connected
        return this.pull();
      } else {

        // oops. This might be caused by an unreachable server.
        // Or the server canceled it for what ever reason, e.g.
        // heroku kills the request after ~30s.
        // we'll try again after a 3s timeout
        //
        window.setTimeout(this.pull, 3000);
        return this.hoodie.checkConnection();
      }
    }
  };


  // ### handle changes from remote
  //
  Remote.prototype._handleBootstrapSuccess = function() {
    this.trigger('bootstrap:end');
  };

  // ### handle changes from remote
  //
  Remote.prototype._handlePullResults = function(changes) {
    var doc, event, object, _i, _len, _results = [];

    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;

      if (this.prefix && doc._id.indexOf(this.prefix) !== 0) {
        continue;
      }

      object = this._parseFromRemote(doc);

      if (object._deleted) {
        if (!this.isKnownObject(object)) {
          continue;
        }
        event = 'remove';
        this.isKnownObject(object);
      } else {
        if (this.isKnownObject(object)) {
          event = 'update';
        } else {
          event = 'add';
          this.markAsKnownObject(object);
        }
      }

      this.trigger("" + event, object);
      this.trigger("" + event + ":" + object.type, object);
      this.trigger("" + event + ":" + object.type + ":" + object.id, object);
      this.trigger("change", event, object);
      this.trigger("change:" + object.type, event, object);
      _results.push(this.trigger("change:" + object.type + ":" + object.id, event, object));

    }
    return _results;
  };

  return Remote;

})(Hoodie.Store);

ConnectionError = (function(_super) {

  'use strict';

  function ConnectionError(message, data) {
    this.message = message;
    this.data = data;
    ConnectionError.__super__.constructor.apply(this, arguments);
  }

  Object.deepExtend(ConnectionError, _super);

  ConnectionError.prototype.name = "ConnectionError";

  return ConnectionError;

})(Error);

