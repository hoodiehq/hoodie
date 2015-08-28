var Hoodie = global.Hoodie

module.exports = function (test) {
  test('hoodie', function (t) {
    t.ok(Hoodie, 'global')

    var hoodie = new Hoodie(window.location.origin)
    t.is(hoodie.baseUrl, window.location.origin, 'baseUrl')

    t.is(typeof hoodie.id(), 'string', 'id')

    ;[
      'on',
      'one',
      'off',
      'trigger',
      'request',
      'open',
      'extend'
    ].forEach(function (method) {
      t.is(typeof hoodie[method], 'function', method)
    })

    t.ok(hoodie.isConnected(), 'connected')

    hoodie.checkConnection().then(t.end, t.fail)
  })
}
