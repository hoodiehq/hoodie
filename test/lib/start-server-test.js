var hoodieServer = require('../../')

module.exports = function (test, name, config, testfn) {
  test(name, function (t) {
    hoodieServer.start(config, function (error) {
      if (error) throw error
      testfn(t, function () {
        t.end()
        process.exit()
      })
    })
  })
}
