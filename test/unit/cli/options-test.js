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

var getCliOptions = proxyquire('../../../cli/options', {
  './hoodie-defaults': function () {
    return {
      port: 'hoodie-default-port',
      public: 'hoodie-default-public',
      dbUrl: 'hoodie-default-dbUrl'
    }
  },
  './app-defaults': mockAppDefaults(),
  'yargs': yargsApi
})

test('config order', function (t) {
  var options = getCliOptions('project-path')
  var cliOptions = yargsApi.options.lastCall.arg

  t.is(cliOptions.public.default, 'app-default-public', 'App defaults override hoodie defaults')
  t.is(cliOptions.dbUrl.default, 'hoodie-default-dbUrl', 'Falls back to Hoodie defaults')
  t.is(options.port, 'cli-port', 'returns options from yargs')

  t.end()
})
