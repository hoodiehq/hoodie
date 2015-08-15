var ports = require('ports')

module.exports = function (test, name, testfn) {
  test(name, function (t) {
    require('../../../')({
      argv: {
        'custom-ports': '5001,5011,' + ports.getPort('hoodie-server-couch'),
        'in-memory': true
      },
      env: {
        HOODIE_SETUP_PASSWORD: '12345'
      }
    }, function (error, server, env_config) {
      if (error) throw error

      server.start(function () {
        testfn(t, env_config, function () {
          t.end()
          process.exit()
        })
      })
    })
  })
}
