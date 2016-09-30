module.exports = getHoodieDefaults

function getHoodieDefaults () {
  return {
    console: false,
    bindAddress: '127.0.0.1',
    port: 8080,
    data: '.hoodie',
    public: 'public',
    dbUrl: undefined,
    inMemory: false,
    loglevel: 'warn',
    url: undefined
  }
}
