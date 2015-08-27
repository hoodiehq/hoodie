var Hoodie = global.Hoodie

module.exports = function (test) {
  test('plugins', function (t) {
    var hoodie = new Hoodie(window.location.origin)
    t.is(typeof hoodie.test, 'function', 'method exposed')
    hoodie.request('get', hoodie.baseUrl + '/test/route')
    .then(function (res) {
      t.ok(res.ok, 'GET test route')

      return hoodie.request('GET', '/_plugins/test/_api')
    }, t.fail)

    .then(function (res) {
      t.is(res.method, 'get', 'dynamic hook GET')

      return hoodie.request('POST', '/_plugins/test/_api', {data: {test: true}})
    }, t.fail)

    .then(function (res) {
      t.ok(res.payload.test, 'dynamic hook POST')

      return hoodie.test({foo: 'bar'})
    }, t.fail)

    .then(function (res) {
      t.is(res.foo, 'bar', 'response is ok')

      return hoodie.test({foo: 'bar', fail: true})
    }, t.fail)

    .then(t.fail, function (res) {
      t.ok(res.error, 'has error')
      t.end()
    })
  })
}
