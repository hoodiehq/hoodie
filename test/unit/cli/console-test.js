//TODO: check if need noCallThru
var proxyquire = require('proxyquire').noCallThru()
var test = require('tap').test

var mockAccountApi = function () {
  return {

  }
}

var mockOptions = function () {
  return {

  }
}


var console = proxyquire('../../../cli/console')

test('admin console', function (t) {

});