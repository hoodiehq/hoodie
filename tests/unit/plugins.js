var Hoodie = global.Hoodie

module.exports = function (test) {
  test('plugins', function (t) {
    var hoodie = new Hoodie(window.location.origin)
    t.is(typeof hoodie.test, 'function', 'method exposed')
    hoodie.test({foo: 'bar'})
    .then(function (res) {
      t.is(res.foo, 'bar', 'response')
      t.end()
    }, t.fail)
  })
}
