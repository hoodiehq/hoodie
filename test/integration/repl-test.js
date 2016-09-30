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

test('admin client in the REPL scope', function (t) {
  var server = new Hapi.Server(hapiOptions)

  server.connection({port: 8090})

  server.register(hapiPluginOptions, function () {
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
      t.end()
      // TODO I couldn't find another way to stop the REPL server
      process.exit(0)
    })

    var state = 0

    sock.on('readable', function (size) {
      var buffer = sock.read()
      if (!buffer) {
        return
      }

      var result = buffer.toString('ascii')

      if (state === 0) {
        t.notEqual(result.indexOf('hoodie >'), -1)
        sock.write('accounts\n')
      } else if (state === 1) {
        t.notEqual(result.indexOf('add'), -1)
        t.notEqual(result.indexOf('find'), -1)
        t.notEqual(result.indexOf('findAll'), -1)
        t.notEqual(result.indexOf('update'), -1)
        t.notEqual(result.indexOf('remove'), -1)
        sock.write('.exit\n')
      }

      state++
    })
  })
})

