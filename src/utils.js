'use strict';

window.__bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
},

window.__extends = function(child, parent) {
  for (var key in parent) {
    if (parent.hasOwnProperty(key)) {
      child[key] = parent[key];
    }
  }
  function Ctor() {
    this.constructor = child;
  }
  Ctor.prototype = parent.prototype;
  child.prototype = new Ctor();
  child.__super__ = parent.prototype;

  return child;
};
