'use strict';

var __bind = function(fn, me) {
  return function() {
    return fn.apply(me, arguments);
  };
},

__hasProp = {}.hasOwnProperty,

__extends = function(child, parent) {
  for (var key in parent) {
    if (__hasProp.call(parent, key)) {
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
