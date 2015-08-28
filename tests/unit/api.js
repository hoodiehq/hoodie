var Hoodie = global.Hoodie

module.exports = function (test) {
  test('api', function (t) {
    var hoodie = new Hoodie(window.location.origin)

    hoodie.request('get', hoodie.baseUrl + '/_api')

    .then(function (res) {
      t.ok(res.version, 'db has version')
      t.ok(res.vendor, 'db has vendor')

      return hoodie.request('get', '/_all_dbs')
    }, t.fail)

    .then(t.fail, function (err) {
      t.is(err.status, 404, 'all dbs not available')

      return hoodie.request('get', '/_plugins')
    })

    .then(function (plugins) {
      t.same(plugins
      .map(function (plugin) {
        return plugin.name
      })
      .sort(), [
        'appconfig',
        'email',
        'test',
        'users'
      ], 'plugins loaded')

      return hoodie.request('get', '/_plugins/test')
    }, t.fail)

    .then(function (plugin) {
      t.is(plugin.name, 'test', 'loaded plugin available')

      return hoodie.request('get', '/_plugins/nope')
    }, t.fail)

    .then(t.fail, function (err) {
      t.is(err.status, 404, 'non-existent plugin not available')

      t.end()
    })
  })
}
