// Karma configuration
// Generated on Fri Jul 12 2013 09:10:47 GMT+0100 (BST)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'test/lib/bind.js',
  'lib/jquery/jquery.js',
  'src/utils.js',
  'test/lib/jasmine-helpers.js',

  'src/hoodie.js',

  'src/hoodie/events.js',
  'src/hoodie/promises.js',
  'src/hoodie/request.js',
  'src/hoodie/connection.js',
  'src/hoodie/uuid.js',
  'src/hoodie/dispose.js',
  'src/hoodie/open.js',

  'src/hoodie/store.js',
  'src/hoodie/remote.js',
  'src/hoodie/local_store.js',
  'src/hoodie/config.js',
  'src/hoodie/account.js',
  'src/hoodie/account_remote.js',
  'src/hoodie/errors.js',
  'test/mocks/*.js',
  'test/specs/**/*.spec.js'
];


// list of files to exclude
exclude = [
  'test/specs/extensions/**/*.spec.js'
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['PhantomJS'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = true;
