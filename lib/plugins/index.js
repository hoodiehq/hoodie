module.exports = registerPlugins

function registerPlugins (config, callback) {
  var options = {config}

  var hapiPlugins = [
    require('h2o2'),
    require('inert'),
    require('vision'),
    require('lout')
  ]

  var localPlugins = [
    require('./log'),
    require('./public')
  ].map(function (register) { return {options, register} })

  var hoodieCorePlugins = ['account', 'store'].map(function (name) {
    return {
      register: require('@hoodie/' + name),
      options: config[name],
      routes: {
        prefix: '/hoodie/' + name + '/api'
      }
    }
  })

  callback(null, hapiPlugins.concat(localPlugins, hoodieCorePlugins))
}
