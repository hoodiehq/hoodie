// Global
// ========

// the Global Module provides a simple API to find objects from the global
// stores
// 
// For example, the syntax to find all objects from the global store
// looks like this:
// 
//     hoodie.global.findAll().done( handleObjects )
// 
// okay, might not be the best idea to do that with 1+ million objects, but
// you get the point
// 

Hoodie.Global = (function () {

  'use strict';

  function Global(hoodie) {

    // vanilla API syntax:
    // hoodie.global.findAll()
    return hoodie.open("global");
  }

  return Global;

})();

// extend Hoodie
Hoodie.extend('global', Hoodie.Global);
