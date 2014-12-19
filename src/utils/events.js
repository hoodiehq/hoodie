
var JQEventEmitter = require('jqevents');
var extend = require('extend');


var exports = module.exports = function(hoodie, context, namespace) {
  if (context && namespace) {
    return exports.scopedEventEmitter.apply(null, arguments);
  }

  var emitter = JQEventEmitter.create();

  // aliases
  emitter.one = emitter.once;
  emitter.bind = emitter.on;
  emitter.unbind = emitter.off;

  // monkey patch emit with try-catch
  // because of https://github.com/hoodiehq/hoodie.js/issues/376
  emitter.trigger = emitter.emit = (function(emit) {
    return function() {
      try {
        emit.apply(emitter, arguments);
      } catch (error) {
        setTimeout(function() {
          throw error;
        });
      }
    };
  })(emitter.emit);

  extend(hoodie, emitter);

  return emitter;
};

exports.METHODS = ['on','off','one','trigger','bind','unbind'];

var regexMatchBeginningOfEventNames = /(^|\s)/g;
exports.scopedEventEmitter = function(hoodie, context, namespace) {
  var scopedEmitter = {};

  exports.METHODS.forEach(function(fn) {
    scopedEmitter[fn] = function() {
      var args = [].slice.call(arguments);
      args[0] = args[0].replace(regexMatchBeginningOfEventNames, '$1' + namespace + ':');
      hoodie[fn].apply(hoodie, args);
    };
  });

  extend(context, scopedEmitter);
  return scopedEmitter;
};
