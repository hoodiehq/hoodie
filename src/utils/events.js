/*jshint forin: false */
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var extend = require('extend');


var exports = module.exports = function(hoodie, context, namespace) {
  if (context && namespace) {
    return exports.scopedEventEmitter.apply(null, arguments);
  }

  var emitter = new exports.HoodieEventEmitter();
  extend(hoodie, emitter);
  return emitter;
};

exports.MAP = {
  bind: 'on',
  one: 'once',
  trigger: 'emit',
  unbind: 'removeListener',
};

exports.METHODS = (function() {
  var METHODS = [];
  var pt = EventEmitter.prototype;

  for (var fn in pt) {
    if (typeof pt[fn] === 'function') {
      METHODS.push(fn);
    }
  }

  return METHODS.concat(Object.keys(exports.MAP));
})();

exports.HoodieEventEmitter = (function() {
  function HoodieEventEmitter() {
    EventEmitter.call(this);
  }

  inherits(HoodieEventEmitter, EventEmitter);

  Object.keys(exports.MAP).forEach(function(fn) {
    HoodieEventEmitter.prototype[fn] = EventEmitter.prototype[exports.MAP[fn]];
  });

  return HoodieEventEmitter;
})();

exports.scopedEventEmitter = function(hoodie, context, namespace) {
  var scopedEmitter = {};

  exports.METHODS.forEach(function(fn) {
    scopedEmitter[fn] = function() {
      var args = [].slice.call(arguments);
      args[0] = namespace + ':' + args[0];
      hoodie[fn].apply(hoodie, args);
    };
  });

  extend(context, scopedEmitter);
  return scopedEmitter;
};
