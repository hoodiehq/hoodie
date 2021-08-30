const Transform = require('stream').Transform
const util = require('util')

const log = require('npmlog')
const qs = require('querystring')

function HoodieTransform () {
  if (!(this instanceof HoodieTransform)) {
    return new HoodieTransform()
  }
  Transform.call(this, {
    objectMode: true,
    transform: transform
  })
}

util.inherits(HoodieTransform, Transform)

function transform (data, enc, next) {
  if (data.event === 'error') {
    log.error(
      data.error.name,
      new Date(data.timestamp).toISOString(),
      data.error.message,
      data.error
    )
  }

  if (data.event === 'response') {
    const path = data.path +
      (Object.keys(data.query).length ? '?' + qs.stringify(data.query) : '')
    log.http(
      data.event,
      new Date(data.timestamp).toISOString() + ' -',
      data.source.remoteAddress + ' -',
      data.method.toUpperCase(),
      path,
      data.statusCode,
      data.responseTime + 'ms'
    )
  }

  if (data.event === 'request' || data.event === 'log') {
    let level = findLogLevel(Object.keys(log.levels), data.tags) || 'verbose'
    log[level](
      data.event,
      new Date(data.timestamp).toISOString(),
      data.tags.length ? data.tags : data.data,
      data.tags.length ? data.data : ''
    )
  }

  log.silly(data.event, data)
  next(null)
}

function findLogLevel (levels, tags) {
  for (let i = 0; i < tags.length; i++) {
    for (let j = 0; j < levels.length; j++) {
      if (levels[j] === tags[i]) {
        tags.splice(i, 1)
        return levels[j]
      }
    }
  }
}

module.exports = HoodieTransform
