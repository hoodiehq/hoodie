exports.processSend = function (env_config, callback) {
  if (!process.send) return callback(null)

  process.send({
    app: {
      started: true
    },
    pid: process.pid,
    stack: {
      couch: {
        port: Number(env_config.couch.port),
        host: env_config.host
      },
      www: {
        port: env_config.www_port,
        host: env_config.host
      },
      admin: {
        port: env_config.admin_port,
        host: env_config.host
      }
    }
  })

  return callback(null)
}
