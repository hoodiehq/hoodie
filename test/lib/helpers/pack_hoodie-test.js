var path = require('path');
var hoodiejs = require('../../../lib/helpers/pack_hoodie.js');

var plugins = [
  'hoodie-plugin-appconfig',
  'hoodie-plugin-email',
  'hoodie-plugin-users'
];

// Dummy config object with plugins attribute.
var config = {
  app: {},
  plugins: plugins.reduce(function (memo, name) {
    memo[name] = {
      path: path.resolve(__dirname, '../../../node_modules/' + name)
    };
    return memo;
  }, {})
};

// The actual plugin files wont be loaded as the plugins are not in
// `node_modules`, but at least we test that we get a readable stream and that
// it has the expected output (sort of).
exports['we get a readable stream with concatenated js'] = function (t) {
  var stream = hoodiejs(config);
  var chunks = [];
  stream.on('data', function (buf) {
    chunks.push(buf.toString());
  });
  stream.on('end', function () {
    var js = chunks.join('');
    t.ok(/\n\/\/ HOODIE PLUGINS/.test(js));
    var files = Object.keys(config.plugins).map(function (name) {
      return config.plugins[name].path;
    });
    t.equal(files.length, 3);
    files.forEach(function (file) {
      var r = new RegExp('// ' + file);
      t.ok(r.test(js));
    });
    t.done();
  });
};

