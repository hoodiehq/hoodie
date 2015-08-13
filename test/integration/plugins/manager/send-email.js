var _ = require('lodash')
var nodemailer = require('nodemailer')
var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var OPTS = require('./lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

test('sendEmail function', function (t) {
  t.plan(4)
  var email = {
    to: 'to@hood.ie',
    from: 'from@hood.ie',
    subject: 'subject',
    text: 'blah blah'
  }
  var createTransport_calls = []
  var sendMail_calls = []
  var close_calls = []

  var _createTransport = nodemailer.createTransport
  nodemailer.createTransport = function (config) {
    createTransport_calls.push(config)
    return {
      close: function (callback) {
        close_calls.push(config)
        if (callback) {
          callback()
        }
      },
      sendMail: function (opt, callback) {
        sendMail_calls.push(opt)
        callback()
      }
    }
  }
  pluginsManager.start(OPTS, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})
    hoodie.sendEmail(email, function () {
      var appcfg = {
        foo: 'bar',
        email_host: 'emailhost2',
        email_port: 123,
        email_secure: false,
        email_service: 'Gmail2'
      }
      var url = hoodie._resolve('app/config')

      request.get(url, function (error, res, doc) {
        if (error) throw error
        doc.config = appcfg
        request.put(url, {body: doc}, function (error) {
          if (error) throw error
          setTimeout(function () {
            var email2 = _.clone(email)
            email2.attachments = [{
              filename: 'text3.txt',
              path: '/path/to/file.txt'
            }, {
              path: 'data:text/plain;base64,aGVsbG8gd29ybGQ='
            }]
            hoodie.sendEmail(email2, function () {
              t.same(createTransport_calls, [
                {
                  host: 'emailhost',
                  port: 465,
                  auth: {
                    user: 'gmail.user@gmail.com',
                    pass: 'userpass'
                  },
                  secure: true,
                  service: 'Gmail'
                },
                {
                  host: 'emailhost2',
                  port: 123,
                  secure: false,
                  service: 'Gmail2'
                }
              ])
              t.same(close_calls, [
                {
                  host: 'emailhost',
                  port: 465,
                  auth: {
                    user: 'gmail.user@gmail.com',
                    pass: 'userpass'
                  },
                  secure: true,
                  service: 'Gmail'
                }
              ])
              delete email2.attachments[0].path
              t.same(sendMail_calls, [email, email2])
              nodemailer.createTransport = _createTransport
              manager.stop(function (error) {
                t.error(error)
                t.end()
                process.exit()
              })
            })
          }, 100)
        })
      })
    })
  })
})
