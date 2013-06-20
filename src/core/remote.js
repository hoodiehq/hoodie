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
// * update(new_properties )
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
var ConnectionError,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Hoodie.Remote = (function(_super) {

  'use strict';

  function Remote (hoodie, options) {
    this.hoodie = hoodie;

    if (options === null) {
      options = {};
    }

    this._handlePullResults = __bind(this._handlePullResults, this);
    this._handlePullError = __bind(this._handlePullError, this);
    this._handlePullSuccess = __bind(this._handlePullSuccess, this);
    this._restartPullRequest = __bind(this._restartPullRequest, this);
    this._mapDocsFromFindAll = __bind(this._mapDocsFromFindAll, this);
    this._parseAllFromRemote = __bind(this._parseAllFromRemote, this);
    this._parseFromRemote = __bind(this._parseFromRemote, this);
    this.sync = __bind(this.sync, this);
    this.push = __bind(this.push, this);
    this.pull = __bind(this.pull, this);
    this.disconnect = __bind(this.disconnect, this);
    this.connect = __bind(this.connect, this);

    if (options.name !== null) {
      this.name = options.name;
    }
    if (options.prefix !== null) {
      this.prefix = options.prefix;
    }
    if (options.connected !== null) {
      this.connected = options.connected;
    }
    if (options.baseUrl !== null) {
      this.baseUrl = options.baseUrl;
    }
    this._knownObjects = {};
    if (this.isConnected()) {
      this.connect();
    }
  }

  $.extend(Remote, _super);

  Remote.prototype.name = void 0;

  Remote.prototype.connected = false;

  Remote.prototype.prefix = '';

  Remote.prototype.request = function(type, path, options) {

    if (options === null) {
      options = {};
    }

    if (this.name) {
      path = "/" + (encodeURIComponent(this.name)) + path;
    }

    if (this.baseUrl) {
      path = "" + this.baseUrl + path;
    }

    options.contentType || (options.contentType = 'application/json');

    if (type === 'POST' || type === 'PUT') {
      options.dataType || (options.dataType = 'json');
      options.processData || (options.processData = false);
      options.data = JSON.stringify(options.data);
    }

    return this.hoodie.request(type, path, options);
  };

  Remote.prototype.get = function(view_name, params) {
    return console.log.apply(console, [".get() not yet implemented"].concat(__slice.call(arguments)));
  };

  Remote.prototype.post = function(update_function_name, params) {
    return console.log.apply(console, [".post() not yet implemented"].concat(__slice.call(arguments)));
  };

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

  Remote.prototype.findAll = function(type) {
    var defer, endkey, path, startkey;

    defer = Remote.__super__.findAll.apply(this, arguments);

    if (this.hoodie.isPromise(defer)) {
      return defer;
    }

    path = "/_all_docs?include_docs=true";

    switch (true) {
      case (type !== null) && this.prefix !== '':
        startkey = "" + this.prefix + type + "/";
        break;
      case type !== null:
        startkey = "" + type + "/";
        break;
      case this.prefix !== '':
        startkey = this.prefix;
        break;
      default:
        startkey = '';
    }

    if (startkey) {
      endkey = startkey.replace(/.$/, function(char) {
        var charCode;
        charCode = char.charCodeAt(0);
        return String.fromCharCode(charCode + 1);
      });
      path = "" + path + "&startkey=\"" + (encodeURIComponent(startkey)) + "\"&endkey=\"" + (encodeURIComponent(endkey)) + "\"";
    }
    return this.request("GET", path).pipe(this._mapDocsFromFindAll).pipe(this._parseAllFromRemote);
  };

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

  Remote.prototype.remove = function(type, id) {
    return this.update(type, id, {
      _deleted: true
    });
  };

  Remote.prototype.removeAll = function(type) {
    return this.updateAll(type, {
      _deleted: true
    });
  };

  Remote.prototype.isKnownObject = function(object) {
    var key;
    key = "" + object.type + "/" + object.id;
    return this._knownObjects[key] !== null;
  };

  Remote.prototype.markAsKnownObject = function(object) {
    var key;
    key = "" + object.type + "/" + object.id;
    return this._knownObjects[key] = 1;
  };

  Remote.prototype.connect = function(options) {
    this.connected = true;
    return this.pull();
  };

  Remote.prototype.disconnect = function() {
    var _ref, _ref1;
    this.connected = false;
    if ((_ref = this._pullRequest) !== null) {
      _ref.abort();
    }
    return (_ref1 = this._pushRequest) !== null ? _ref1.abort() : void 0;
  };

  Remote.prototype.isConnected = function() {
    return this.connected;
  };

  Remote.prototype.getSinceNr = function() {
    return this._since || 0;
  };

  Remote.prototype.setSinceNr = function(seq) {
    return this._since = seq;
  };

  Remote.prototype.pull = function() {
    this._pullRequest = this.request('GET', this._pullUrl());
    if (this.isConnected()) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }
    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };

  Remote.prototype.push = function(objects) {
    var object, objectsForRemote, _i, _len;

    if (!(objects !== null ? objects.length : void 0)) {
      return this.hoodie.resolveWith([]);
    }

    objectsForRemote = [];

    for (_i = 0, _len = objects.length; _i < _len; _i++) {
      object = objects[_i];
      this._addRevisionTo(object);
      object = this._parseForRemote(object);
      objectsForRemote.push(object);
    }

    return this._pushRequest = this.request('POST', "/_bulk_docs", {
      data: {
        docs: objectsForRemote,
        new_edits: false
      }
    });

  };

  Remote.prototype.sync = function(objects) {
    return this.push(objects).pipe(this.pull);
  };

  Remote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.on(event, cb);
  };

  Remote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1" + this.name + ":$2");
    return this.hoodie.one(event, cb);
  };

  Remote.prototype.trigger = function() {
    var event, parameters, _ref;
    event = arguments[0], parameters = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this.hoodie).trigger.apply(_ref, ["" + this.name + ":" + event].concat(__slice.call(parameters)));
  };

  Remote.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];

  Remote.prototype._parseForRemote = function(object) {
    var attr, properties;

    properties = $.extend({}, object);

    for (attr in properties) {
      if (~this._validSpecialAttributes.indexOf(attr)) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete properties[attr];
    }
    properties._id = "" + properties.type + "/" + properties.id;
    if (this.prefix) {
      properties._id = "" + this.prefix + properties._id;
    }
    delete properties.id;
    return properties;
  };

  Remote.prototype._parseFromRemote = function(object) {
    var id, ignore, _ref;

    id = object._id || object.id;

    delete object._id;

    if (this.prefix) {
      id = id.replace(new RegExp('^' + this.prefix), '');
    }

    _ref = id.match(/([^\/]+)\/(.*)/), ignore = _ref[0], object.type = _ref[1], object.id = _ref[2];
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

  Remote.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;

    try {
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
    } catch (_error) {}

    currentRevNr = parseInt(currentRevNr, 10) || 0;
    newRevisionId = this._generateNewRevisionId();

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

  Remote.prototype._generateNewRevisionId = function() {
    return this.hoodie.uuid(9);
  };

  Remote.prototype._mapDocsFromFindAll = function(response) {
    return response.rows.map(function(row) {
      return row.doc;
    });
  };

  Remote.prototype._pullUrl = function() {
    var since;
    since = this.getSinceNr();
    if (this.isConnected()) {
      return "/_changes?include_docs=true&since=" + since + "&heartbeat=10000&feed=longpoll";
    } else {
      return "/_changes?include_docs=true&since=" + since;
    }
  };

  Remote.prototype._restartPullRequest = function() {
    var _ref;
    return (_ref = this._pullRequest) !== null ? _ref.abort() : void 0;
  };

  Remote.prototype._handlePullSuccess = function(response) {
    this.setSinceNr(response.last_seq);
    this._handlePullResults(response.results);

    if (this.isConnected()) {
      return this.pull();
    }
  };

  Remote.prototype._handlePullError = function(xhr, error, resp) {
    if (!this.isConnected()) {
      return;
    }

    switch (xhr.status) {
      case 401:
        this.trigger('error:unauthenticated', error);
        return this.disconnect();
      case 404:
        return window.setTimeout(this.pull, 3000);
      case 500:
        this.trigger('error:server', error);
        window.setTimeout(this.pull, 3000);
        return this.hoodie.checkConnection();
      default:

        if (!this.isConnected()) {
          return;
        }

        if (xhr.statusText === 'abort') {
          return this.pull();
        } else {
          window.setTimeout(this.pull, 3000);
          return this.hoodie.checkConnection();
        }
    }
  };

  Remote.prototype._handlePullResults = function(changes) {
    var doc, event, object, _i, _len, _results;
    _results = [];

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

        delete this.isKnownObject(object);

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

  $.extend(ConnectionError, _super);

  ConnectionError.prototype.name = "ConnectionError";

  function ConnectionError (message, data) {
    this.message = message;
    this.data = data;
    ConnectionError.__super__.constructor.apply(this, arguments);
  }

  return ConnectionError;

})(Error);
