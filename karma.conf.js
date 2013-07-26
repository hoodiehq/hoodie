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
  'src/events.js',
  'test/lib/jasmine-helpers.js',
  'src/hoodie.js',
  'src/core/request.js',

  'src/core/store.js',
  'src/core/remote.js',
  'src/core/local_store.js',
  'src/core/config.js',
  'src/core/account.js',
  'src/core/account_remote.js',
  'src/core/errors.js',
  'src/extensions/email.js',
  'src/extensions/user.js',
  'src/extensions/global.js',
  'src/extensions/share.js',
  'src/extensions/share_instance.js',
  'test/mocks/*.js',
  'test/specs/**/*.spec.js'
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
