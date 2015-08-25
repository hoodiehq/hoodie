var Hoodie = global.Hoodie

module.exports = function (test) {
  test('plugins', function (t) {
    var hoodie = new Hoodie(window.location.origin)
    t.is(typeof hoodie.test, 'function', 'method exposed')
    hoodie.test({foo: 'bar'})
    .then(function (res) {
      console.log(res)
      t.ok(res)
      t.end()
    }, t.fail)
  })
}
