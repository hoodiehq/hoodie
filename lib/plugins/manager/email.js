var _ = require('lodash')
var nodemailer = require('nodemailer')

exports.start = function (config_manager) {
  var transport

  function updateConfig (appcfg) {
    var cfg = {
      host: appcfg.email_host,
      port: appcfg.email_port,
      secure: appcfg.email_secure,
      service: appcfg.email_service
    }

    if (appcfg.email_user) {
      cfg.auth = {
        user: appcfg.email_user,
        pass: appcfg.email_pass
      }
    }

    if (transport) {
      transport.close()
    }

    // create new connection pool with updated config
    transport = nodemailer.createTransport(cfg)
  }

  // set up initial config
  updateConfig(config_manager.getAppConfig())

  return {
    updateConfig: updateConfig,
    sendEmail: function (email, callback) {
      email = _.cloneDeep(email)
      if (email.attachments) {
        email.attachments = email.attachments.map(function (v) {
          if (!/^data:/.test(v.path)) delete v.path
          return v
        })
      }

      return transport.sendMail(email, callback)
    },
    stop: function (callback) {
      transport.close()
      if (typeof callback === 'function') callback()
    }
  }
}
