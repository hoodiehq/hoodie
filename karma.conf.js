// Karma configuration
// Generated on Mon Aug 12 2013 11:39:58 GMT+0100 (BST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['mocha'],


    // list of files / patterns to load in the browser
    files: [
      'test/lib/bind.js',
      { pattern: 'lib/jquery/jquery.js', watched: false, included: true },
      { pattern: 'lib/expect/expect.js', watched: false, included: true },
      { pattern: 'lib/sinonjs/sinon.js', watched: false, included: true },

      'test/lib/helpers.js',
      'src/hoodie.js',

      'src/hoodie/events.js',
      'src/hoodie/promises.js',
      'src/hoodie/request.js',
      'src/hoodie/connection.js',
      'src/hoodie/uuid.js',
      'src/hoodie/dispose.js',
      'src/hoodie/open.js',

      'src/hoodie/store.js',
      'src/hoodie/scoped_store.js',
      'src/hoodie/remote_store.js',
      'src/hoodie/local_store.js',
      'src/hoodie/config.js',
      'src/hoodie/account.js',
      'src/hoodie/account_remote.js',
      'src/hoodie/errors.js',
      'src/hoodie/task.js',
      'src/hoodie/scoped_task.js',

      'test/mocks/*.js',

      // these are good
      'test/specs/hoodie.spec.js',
      'test/specs/hoodie/account.spec.js',
      'test/specs/hoodie/config.spec.js',

      'test/specs/hoodie/dispose.spec.js',
      'test/specs/hoodie/events.spec.js',
      'test/specs/hoodie/local_store.spec.js',
      'test/specs/hoodie/open.spec.js',
      'test/specs/hoodie/promises.spec.js',
      'test/specs/hoodie/request.spec.js',
      'test/specs/hoodie/store.spec.js',
      'test/specs/hoodie/scoped_store.spec.js',
      'test/specs/hoodie/remote_store.spec.js',
      'test/specs/hoodie/uuid.spec.js',
      'test/specs/hoodie/account_remote.spec.js',
      'test/specs/hoodie/task.spec.js',
      'test/specs/hoodie/scoped_task.spec.js'

      // these need to be fixed

      // this one throws strange errors:
      // TypeError: 'undefined' is not an object (evaluating 'hoodie.request('GET', '/').then
      // dunno why yet
      // 'test/specs/hoodie/connection.spec.js'

    ],


    // list of files to exclude
    exclude: [

    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
