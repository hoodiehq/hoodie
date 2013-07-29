// Karma configuration
// Generated on Mon Jul 22 2013 13:50:18 GMT+0100 (BST)


// base path, that will be used to resolve files and exclude
basePath = '';


// list of files / patterns to load in the browser
files = [
  MOCHA,
  MOCHA_ADAPTER,
  'test/lib/bind.js',
  { pattern: 'lib/jquery/jquery.js', watched: false, included: true },
  { pattern: 'lib/expect/expect.js', watched: false, included: true },
  { pattern: 'lib/sinon.js', watched: false, included: true },

  'test/lib/helpers.js',
  'src/hoodie.js',

  'src/hoodie/events.js',
  'src/hoodie/promises.js',
  'src/hoodie/request.js',
  'src/hoodie/connection.js',
  'src/hoodie/uuid.js',
  'src/hoodie/dispose.js',
  'src/hoodie/open.js',

  'test/mocks/*.js',
  'test/specs/events.spec.js',
  'test/specs/hoodie.spec.js',
  'test/specs/hoodie/account.spec.js',
  'test/specs/hoodie/account_remote.spec.js',
  'test/specs/hoodie/config.spec.js'
];


// list of files to exclude
exclude = [

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
