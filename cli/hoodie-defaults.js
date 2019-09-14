module.exports = getHoodieDefaults

function getHoodieDefaults () {
  return {
    name: undefined,
    address: '127.0.0.1',
    port: 8080,
    data: '.hoodie',
    public: 'public',
    client: {},
    account: {},
    store: {},
    dbUrl: undefined,
    dbUrlPassword: undefined,
    dbUrlUsername: undefined,
    dbAdapter: 'pouchdb-adapter-fs',
    inMemory: false,
    loglevel: 'warn',
    url: undefined,
    adminPassword: undefined,
    plugins: [],
    app: {}
  }
}
