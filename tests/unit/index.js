var http = require('http')
var url = require('url')

var test = require('tape').createHarness()

var Hoodie = global.Hoodie

var reqOptions = url.parse(process.env.TEST_RESULT_SERVER)
reqOptions.method = 'POST'

test.createStream().pipe(http.request(reqOptions, function (res) {
  console.log(res.responseMessage)
}))

test('test', function (t) {
  t.ok(Hoodie, 'hoodie module exposed')
  t.end()
})
