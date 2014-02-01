// Karma configuration
// Generated on Mon Aug 12 2013 11:39:58 GMT+0100 (BST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['browserify', 'mocha'],


    // list of files / patterns to load in the browser
    files: [
      'test/lib/bind.js',
      { pattern: 'node_modules/hoodie.js-assets/jquery/jquery.js', watched: false, included: true },
      { pattern: 'node_modules/expect.js/expect.js', watched: false, included: true },
      { pattern: 'node_modules/sinon/pkg/sinon-1.7.3.js', watched: false, included: true },
      'test/lib/helpers.js',
      // 'test/lib/setup.js',

      // ignoring Constructor specs temporarely for 0.5 due to
      // incompatibilities with browserify, as discussed (@gr2m & @svnlto)
      //
      'test/specs/core/account/index.spec.js',
      'test/specs/core/account/remote.spec.js',
      'test/specs/core/error/error.spec.js',
      'test/specs/core/store/local.spec.js',
      'test/specs/core/store/remote.spec.js',
      'test/specs/core/store/scoped.spec.js',
      'test/specs/core/store/store.spec.js',
      'test/specs/core/config.spec.js',
      'test/specs/core/connection.spec.js',
      'test/specs/core/events.spec.js',
      'test/specs/core/id.spec.js',
      'test/specs/core/request.spec.js',
      'test/specs/core/task/scoped.spec.js',
      'test/specs/core/task/task.spec.js',

      'test/specs/utils/open.spec.js',
      'test/specs/utils/dispose.spec.js',
      'test/specs/utils/generate_id.spec.js',
      'test/specs/utils/promises.spec.js'
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
    browsers: [],

    preprocessors: {
      'test/specs/**/*.js': ['browserify'],
      'test/lib/setup.js': ['browserify']
    },

    // https://github.com/xdissent/karma-browserify#options
    browserify: {},


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true
  });
};
