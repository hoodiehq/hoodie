var http = require('http')
var url = require('url')

localStorage.clear()

var test = require('tape').createHarness()

require('./api.js')(test)
require('./hoodie.js')(test)
require('./plugins.js')(test)
require('./walktrough.js')(test)

var reqOptions = url.parse(process.env.TEST_RESULT_SERVER)
reqOptions.method = 'POST'
test.createStream()

.on('data', console.log.bind(console))
.pipe(http.request(reqOptions, function () {
  console.log('results uploaded')
}))
