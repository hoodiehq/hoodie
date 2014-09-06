
var JQEventEmitter = require('jqevents');
var extend = require('extend');


var exports = module.exports = function(hoodie, context, namespace) {
  if (context && namespace) {
    return exports.scopedEventEmitter.apply(null, arguments);
  }

  var emitter = JQEventEmitter.create();

  // aliases
  emitter.trigger = emitter.emit;
  emitter.bind = emitter.on;
  emitter.unbind = emitter.off;

  extend(hoodie, emitter);

  return emitter;
};

exports.METHODS = ['on','off','one','trigger','bind','undbind'];

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
