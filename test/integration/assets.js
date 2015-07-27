var http = require('http')

var expect = require('expect.js')

var config = require('../lib/config')

describe('handle assets', function () {
  this.timeout(30000)

  it('should get asset path', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/_api/_plugins/_assets/index.html',
      agent: false
    }, function (res) {
      expect(res.statusCode).to.be(200)
      done()
    })
  })
})
