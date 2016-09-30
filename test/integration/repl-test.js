var Hapi = require('hapi')
var Net = require('net')
var test = require('tap').test

var hoodie = require('../../').register
var hapiOptions = {
  debug: {
    request: ['error'],
    log: ['error']
  }
}
var hapiPluginOptions = {
  register: hoodie,
  options: {
    console: true,
    inMemory: true,
    loglevel: 'error'
  }
}

require('npmlog').level = 'error'

test('connect to the REPL server', function (t) {
  t.plan(2)
  var server = new Hapi.Server(hapiOptions)
  server.connection({port: 8090})
  server.register(hapiPluginOptions, function (error) {
    t.notOk(error)

    var address = Net.Socket.prototype.address
    Net.Socket.prototype.address = function () {
      Net.Socket.prototype.address = address
      return {
        family: 'IPv4',
        address: '127.0.0.1'
      }
    }

    var sock = Net.connect(9000)

    sock.once('close', function () {
      t.pass()
      // TODO I couldn't find another way to stop the REPL server
      process.exit(0)
    })

    sock.on('readable', function (size) {
      var buffer = sock.read()
      if (!buffer) {
        return
      }

      sock.write('.exit\n')
    })
  })
})

