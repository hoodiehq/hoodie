var rootPathFactory = require('./root_path_factory');

module.exports = [
  require('./api'),
  rootPathFactory('admin', 'admin_root'),
  rootPathFactory('web', 'www_root'),
  require('./logger'),
  require('./handle_404'),
];
