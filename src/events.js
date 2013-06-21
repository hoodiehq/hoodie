window.Events = window.Events || (function() {

  'use strict';

  function Events() {}

  // ## Bind
  // 
  // bind a callback to an event triggerd by the object
  // 
  //     object.bind 'cheat', blame
  // 
  Events.prototype.bind = function(ev, callback) {
    var calls, evs, name, _i, _len, _results = [];

    evs = ev.split(' ');
    calls = this.hasOwnProperty('_callbacks') && this._callbacks || (this._callbacks = {});

    for (_i = 0, _len = evs.length; _i < _len; _i++) {
      name = evs[_i];
      calls[name] = calls[name] || [];
      _results.push(calls[name].push(callback));
    }
    return _results;
  };

  // alias
  Events.prototype.on = Events.prototype.bind;

  // ## one
  // 
  // same as `bind`, but does get executed only once
  // 
  //     object.one 'groundTouch', gameOver
  // 
  Events.prototype.one = function(ev, callback) {
    this.bind(ev, function() {
      this.unbind(ev, callback);
      callback.apply(this, arguments);
    });
  };

  // ## trigger
  // 
  // trigger an event and pass optional parameters for binding.
  //     object.trigger 'win', score: 1230
  // 
  Events.prototype.trigger = function() {
    var args, callback, ev, list, _i, _len, _ref;

    args = 1 <= arguments.length ? Array.prototype.slice.call(arguments, 0) : [];
    ev = args.shift();
    list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) !== null ? _ref[ev] : null);

    if (!list) {
      return;
    }

    for (_i = 0, _len = list.length; _i < _len; _i++) {
      callback = list[_i];
      callback.apply(this, args);
    }

    return true;
  };

  // ## unbind
  // 
  // unbind to from all bindings, from all bindings of a specific event
  // or from a specific binding.
  // 
  //     object.unbind()
  //     object.unbind 'move'
  //     object.unbind 'move', follow
  // 
  Events.prototype.unbind = function(ev, callback) {
    var cb, i, list, _i, _len, _ref;

    if (!ev) {
      this._callbacks = {};
      return this;
    }

    list = (_ref = this._callbacks) !== null ? _ref[ev] : null;

    if (!list) {
      return this;
    }

    if (!callback) {
      delete this._callbacks[ev];
      return this;
    }

    for (i = _i = 0, _len = list.length; _i < _len; i = ++_i) {
      cb = list[i];

      if (cb !== callback) {
        continue;
      }

      list = list.slice();
      list.splice(i, 1);
      this._callbacks[ev] = list;
      break;
    }

    return this;
  };

  return Events;

})();
