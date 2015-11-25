// var _ = require('lodash')

module.exports = function (config) {
  // var defaultOpts = {
  //   config: config,
  //   database: require('../database')(config),
  //   prefix: '/hoodie/account'
  // }

  return [
    require('inert'),
    require('h2o2')
  ].concat([
    require('./static'),
    require('./http-log')
  ].map(function (plugin) {
    return {
      register: plugin,
      options: {config: config}
    }
  })/*, [{
    register: require('hoodie-server-store'),
    options: _.defaults({prefix: '/hoodie/store'}, defaultOpts)
  }, {
    register: require('hoodie-server-account/routes/session'),
    options: defaultOpts
  }, {
    register: require('hoodie-server-account/routes/account'),
    options: defaultOpts
  }]*/)
}
