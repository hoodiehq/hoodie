var http = require('http')
var url = require('url')

var test = require('tape').createHarness()

require('./hoodie.js')(test)

var reqOptions = url.parse(process.env.TEST_RESULT_SERVER)
reqOptions.method = 'POST'
test.createStream()

.on('data', console.log.bind(console))
.pipe(http.request(reqOptions, function () {
  console.log('results uploaded')
}))
