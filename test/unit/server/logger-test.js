var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

test('logger', function (group) {
  var logger
  var npmlogMock

  group.beforeEach(function (done) {
    var serverMock

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

    serverMock = {
      register: simple.spy()
    }

    require('../../../server/plugins/logger').register(serverMock)
    var transformModule = serverMock.register.lastCall.arg.options.reporters.hoodieReporter[1].module
    var TransformClass = proxyquire(transformModule, {
      npmlog: npmlogMock
    })

    // can also use with 'new', but just calling as a function so that line 9
    // is also covered under test
    logger = TransformClass()

    done()
  })

  group.test('error', function (t) {
    var error = new Error('TestMessage')
    var eventMock = {
      event: 'error',
      error: error,
      timestamp: new Date().getTime()
    }

    logger._transform(eventMock, 'utf8', function () {})

    t.is(npmlogMock.error.callCount, 1, 'Calls npmlog.error')
    var args = npmlogMock.error.lastCall.args

    t.is(args[0], error.name, 'Logs error name')
    t.is(args[2], error.message, 'Logs error message')
    t.equals(args[3], error, 'Logs the whole error')

    t.end()
  })

  group.test('response without query', function (t) {
    var responseEventMock = createResponseEventMock()

    logger._transform(responseEventMock, 'utf8', function () {})

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

    logger._transform(responseEventMock, 'utf8', function () {})

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

    logger._transform(requestEventMock, 'utf8', function () {})

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

    logger._transform(requestEventMock, 'utf8', function () {})

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

    logger._transform(sillyEvent, 'utf8', function () {})

    t.is(npmlogMock.silly.callCount, 1, 'Calls npmlog.silly')
    var args = npmlogMock.silly.lastCall.args

    t.is(args[0], 'unkownEvent', 'Logs event')
    t.equals(args[1], sillyEvent, 'Logs eventObject')

    t.end()
  })

  group.test('next callback', function (t) {
    var eventMock = {
      event: 'ops'
    }

    var transformCallback = simple.spy()

    logger._transform(eventMock, 'utf8', transformCallback)

    t.equals(transformCallback.callCount, 1, 'callback is called')
    t.equals(transformCallback.lastCall.args[1], undefined, 'nothing is passed through transform')

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
