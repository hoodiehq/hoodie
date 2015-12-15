// var _ = require('lodash')
// var PouchDB = require('pouchdb')

module.exports = function (config, usersDb, callback) {
  // var users = new PouchDB(usersDb)
  // users.plugin(require('pouchdb-users'))
  // users.installUsersBehavior()
  // .then(function () {
  //   var defaultOpts = {
  //     config: config,
  //     database: require('./database')(config),
  //     prefix: '/hoodie/account',
  //     users: users
  //   }
  //
  //   // insert below code here
  // }, callback)

  callback(null, [
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
    register: require('@hoodie/server-account-node-sessions'),
    options: defaultOpts
  }, {
    register: require('hoodie-server-store'),
    options: _.defaults({prefix: '/hoodie/store'}, defaultOpts)
  }]*/))
}
