var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

var yargsApi = {
  argv: {
    port: 'cli-port'
  }
}

;[
  'alias',
  'env',
  'epilogue',
  'help',
  'options',
  'showHelpOnFail',
  'version',
  'terminalWidth',
  'wrap'
].forEach(function (key) {
  simple.mock(yargsApi, key).returnWith(yargsApi)
})

function mockAppDefaults () {
  return function () {
    return {
      public: 'app-default-public',
      port: 'app-default-port'
    }
  }
}

var packageJsonMock = {
  version: '1.0.0'
}

var getCliOptions = proxyquire('../../../cli/options', {
  './hoodie-defaults': function () {
    return {
      port: 'hoodie-default-port',
      public: 'hoodie-default-public',
      dbUrl: 'hoodie-default-dbUrl'
    }
  },
  './app-defaults': mockAppDefaults(),
  'yargs': yargsApi,
  '../package.json': packageJsonMock
})

test('config', function (group) {
  group.test('config order', function (t) {
    var options = getCliOptions('project-path')
    var cliOptions = yargsApi.options.lastCall.arg

    t.is(cliOptions.public.default, 'app-default-public', 'App defaults override hoodie defaults')
    t.is(cliOptions.dbUrl.default, 'hoodie-default-dbUrl', 'Falls back to Hoodie defaults')
    t.is(options.port, 'cli-port', 'returns options from yargs')

    t.end()
  })

  group.test('version', function (t) {
    var versionFunc = yargsApi.version.lastCall.arg

    simple.mock(console, 'log', simple.spy())
    simple.mock(process, 'exit', simple.spy())

    versionFunc()

    t.is(console.log.lastCall.arg, packageJsonMock.version, 'Prints version-field of package.json')
    t.is(process.exit.lastCall.arg, 0, 'calls process.exit with status 0 to exit gracefully')

    simple.restore(console, 'log')
    simple.restore(process, 'exit')
    t.end()
  })

  group.test('version error', function (t) {
    var versionFunc = yargsApi.version.lastCall.arg

    simple.mock(console, 'log', simple.spy().throwWith(new Error()))
    simple.mock(process, 'exit', simple.spy())

    versionFunc()

    t.is(process.exit.lastCall.arg, 1, 'calls process.exit with status 1 to show that an error occured')

    simple.restore(console, 'log')
    simple.restore(process, 'exit')
    t.end()
  })

  group.end()
})

