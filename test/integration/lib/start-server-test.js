module.exports = function (test, name, testfn) {
  test(name, function (t) {
    require('../../../')({
      inMemory: true,
      port: 5001,
      adminPort: 5011,
      adminPassword: '12345',
      loglevel: 'error'
    }, function (error, server, env_config) {
      if (error) throw error

      server.start(function () {
        testfn(t, env_config, function (tt) {
          if (tt && tt.end) tt.end()
          t.end()
          process.exit()
        })
      })
    })
  })
}
