module.exports = getDefaults

function getDefaults () {
  return {
    loglevel: 'warn',
    paths: {
      data: '.hoodie',
      public: 'public'
    },
    db: {},

    // core modules
    account: {},
    admin: {},
    client: {},
    store: {},

    // plugins
    plugins: {}
  }
}
