// Karma configuration
// Generated on Mon Aug 12 2013 11:39:58 GMT+0100 (BST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: '',


    // frameworks to use
    frameworks: ['browserify', 'mocha', 'sinon-expect'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'node_modules/hoodie.js-assets/jquery/jquery.js', watched: false, included: true },
      'test/lib/bind.js',
      'test/lib/helpers.js'
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
    logLevel: config.LOG_INFO, // LOG_DEBUG,


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

    // browserifast hackery
    preprocessors: {
      '/**/*.browserify': ['browserify'],
    },

    // https://github.com/xdissent/karma-browserify#options
    browserify: {
      files: [
        // 'test/specs/**/*.spec.js'

        'test/specs/hoodie/account.spec.js',
        'test/specs/hoodie/connection.spec.js',
        'test/specs/hoodie/id.spec.js',
        'test/specs/hoodie/open.spec.js',
        'test/specs/hoodie/remote.spec.js',
        'test/specs/hoodie/request.spec.js',
        'test/specs/hoodie/store.spec.js',
        'test/specs/hoodie/task.spec.js',

        'test/specs/lib/error/error.spec.js',
        'test/specs/lib/store/api.spec.js',
        'test/specs/lib/store/remote.spec.js',
        'test/specs/lib/store/scoped.spec.js',
        'test/specs/lib/task/scoped.spec.js',

        'test/specs/utils/config.spec.js',
        'test/specs/utils/events.spec.js',
        'test/specs/utils/generate_id.spec.js',
        'test/specs/utils/local_storage_wrapper.spec.js',
        'test/specs/utils/promise.spec.js'
      ]
    },


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit

    singleRun: true
  });
};
