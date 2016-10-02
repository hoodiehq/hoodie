var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

test('logger', function (group) {
  var logger
  var npmlogMock
  var serverMock

  group.beforeEach(function (done) {
    npmlogMock = {
      http: simple.spy(),
      error: simple.spy(),
      silly: simple.spy(),
      verbose: simple.spy(),
      warn: simple.spy(),
      levels: {
        warn: 'warn'
      }
    }

    var loggerPlugin = proxyquire('../../../server/plugins/logger', {
      'npmlog': npmlogMock
    })

    serverMock = {
      register: simple.spy()
    }

    loggerPlugin.register(serverMock)
    logger = serverMock.register.lastCall.arg.options.reporters[0].config.callback

    done()
  })

  group.test('error', function (t) {
    var error = new Error('TestMessage')
    var eventMock = {
      event: 'error',
      error: error,
      timestamp: new Date().getTime()
    }

    logger(eventMock)

    t.is(npmlogMock.error.callCount, 1, 'Calls npmlog.error')
    var args = npmlogMock.error.lastCall.args

    t.is(args[0], error.name, 'Logs error name')
    t.is(args[2], error.message, 'Logs error message')
    t.equals(args[3], error, 'Logs the whole error')

    t.end()
  })

  group.test('response without query', function (t) {
    var responseEventMock = createResponseEventMock()

    logger(responseEventMock)

    t.is(npmlogMock.http.callCount, 1, 'Calls npmlog.http')
    var args = npmlogMock.http.lastCall.args

    t.is(args[0], 'response', 'Logs event name')
    t.is(args[2], 'remoteAddress -', 'Logs remote address with trailing slash')
    t.is(args[3], 'GET', 'Logs method upperCase')
    t.is(args[4], 'testPath', 'Logs path without addition if no query given')
    t.is(args[5], 200, 'Logs status')
    t.is(args[6], '400ms', 'logs responseTime and adds unit')

    t.end()
  })

  group.test('response with query', function (t) {
    var responseEventMock = createResponseEventMock()
    responseEventMock.query = {
      testKey: 'testValue'
    }

    logger(responseEventMock)

    t.is(npmlogMock.http.callCount, 1, 'Calls npmlog.http')
    var args = npmlogMock.http.lastCall.args

    t.is(args[4], 'testPath?testKey=testValue', 'Logs query string in path')

    t.end()
  })

  group.test('request', function (t) {
    var requestEventMock = {
      event: 'request',
      tags: ['tag1', 'tag2'],
      timestamp: new Date().getTime(),
      data: 'testDate'
    }

    logger(requestEventMock)

    t.is(npmlogMock.verbose.callCount, 1, 'Calls npmlog.verbose by default')
    var args = npmlogMock.verbose.lastCall.args
    t.is(args[0], 'request', 'Logs event name')
    t.is(args[2], requestEventMock.tags, 'Logs all tags')

    t.end()
  })

  group.test('log with logLevel', function (t) {
    var requestEventMock = {
      event: 'log',
      tags: ['warn'],
      timestamp: new Date().getTime(),
      data: 'testData'
    }

    logger(requestEventMock)

    t.is(npmlogMock.warn.callCount, 1, 'Calls npmlog.warn')
    t.is(requestEventMock.tags.length, 0, 'Strips loglevel-tag')
    var args = npmlogMock.warn.lastCall.args
    t.is(args[0], 'log', 'Logs event name')
    t.is(args[2], requestEventMock.data, 'Logs data if no tags available')
    t.is(args[3], '', 'Logs empty string if no tags left')

    t.end()
  })

  group.test('silly (by default)', function (t) {
    var sillyEvent = {
      event: 'unkownEvent'
    }

    logger(sillyEvent)

    t.is(npmlogMock.silly.callCount, 1, 'Calls npmlog.silly')
    var args = npmlogMock.silly.lastCall.args

    t.is(args[0], 'unkownEvent', 'Logs event')
    t.equals(args[1], sillyEvent, 'Logs eventObject')

    t.end()
  })

  group.test('GoodEvent creation', function (t) {
    var GoodEvent = serverMock.register.lastCall.arg.options.reporters[0].reporter

    var goodEvent = new GoodEvent({}, {})
    t.type(goodEvent._callback, 'function', 'Assign default callback')
    t.type(goodEvent._callback(), 'undefined', 'Default calllbacks does nothing')

    t.end()
  })

  group.test('GoodEvent.init()', function (t) {
    var GoodEvent = serverMock.register.lastCall.arg.options.reporters[0].reporter

    var constructorCb = simple.spy()
    var goodEvent = new GoodEvent({}, {
      callback: constructorCb
    })

    var streamMock = {
      pipe: simple.spy().returnWith({
        on: simple.spy().callbackWith(null)
      })
    }

    var functionCb = simple.spy()
    goodEvent.init(streamMock, null, functionCb)

    simple.spy(goodEvent._callback)
    t.is(constructorCb.callCount, 1, 'Invokes callback given to constructor')
    t.is(functionCb.callCount, 1, 'Invokes given callback')
    t.end()
  })

  function createResponseEventMock () {
    return {
      event: 'response',
      path: 'testPath',
      query: {},
      method: 'get',
      statusCode: 200,
      responseTime: 400,
      timestamp: new Date().getTime(),
      source: {
        remoteAddress: 'remoteAddress'
      }
    }
  }

  group.end()
})

