var gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  header = require('gulp-header'),
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  streamify = require('gulp-streamify'),
  clean = require('gulp-clean'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  karma = require('gulp-karma');

// TODO: Extract to a banner file
var banner = '// <%= pkg.title %> - <%= pkg.version%>\n';
banner += '// https://github.com/hoodiehq/hoodie.js\n';
banner += '// Copyright 2012 - 2014 https://github.com/hoodiehq/\n';
banner += '// Licensed Apache License 2.0\n';
banner += '\n';

var pkg = require('./package.json');
var paths = {
  dist: 'dist/',
  src: 'src/**/*.js',
  test: 'test/specs/**/*.js'
};

gulp.task('clean', function () {
  return gulp.src(paths.dist, {read: false})
    .pipe(clean());
});

gulp.task('jshint', function () {
  return gulp.src(['Gulpfile.js', paths.src, paths.test])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});


// TODO: Do we need so much streamify? looks ugly
gulp.task('bundle', ['clean'], function () {
  browserify('./src/hoodie.js')
    .external('jquery')
    .bundle({standalone: 'Hoodie'})
    .pipe(source('hoodie.js'))
    .pipe(streamify(header(banner, { pkg: pkg })))
    .pipe(gulp.dest(paths.dist))
    .pipe(streamify(uglify()))
    .pipe(streamify(concat(pkg.name + '.min.js')))
    .pipe(streamify(header(banner, { pkg: pkg })))
    .pipe(gulp.dest(paths.dist));
});

// Test
gulp.task('karma:dev', function () {
  // Be sure to return the stream
  return gulp.src(paths.test)
    .pipe(karma({
      configFile: 'karma.conf.js',
      browsers: ['PhantomJS']
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('karma:continuous', function () {
  // Be sure to return the stream
  return gulp.src(paths.test)
    .pipe(karma({
      singleRun: true,
      sauceLabs: {
        username: 'hoodiehq',
        accessKey: '6ab72d53-5807-40bb-be53-64cb7adba626',
        testName: 'hoodie.js test'
      },
      customLaunchers: {
        sl_chrome_mac: {
          base: 'SauceLabs',
          platform: 'mac 10.8',
          browserName: 'chrome'
        },
        sl_safari_mac: {
          base: 'SauceLabs',
          platform: 'mac 10.8',
          browserName: 'safari'
        },
        //sl_firefox_win7: {
        //base: 'SauceLabs',
        //platform: 'Windows 7',
        //browserName: 'Firefox'
        //},
        // IE 10 & 11 is WIP
        // sl_ie10_win7: {
        //   base: 'SauceLabs',
        //   platform: 'Windows 7',
        //   browserName: 'internet explorer',
        //   version: '10'
        // },
        // sl_ie11_win8: {
        //   base: 'SauceLabs',
        //   platform: 'Windows 8.1',
        //   browserName: 'internet explorer',
        //   version: '11'
        // }
      },
      browsers: [
        'PhantomJS',
        'sl_chrome_mac',
        'sl_safari_mac',
        //'sl_firefox_win7',
        // 'sl_ie10_win7',
        // 'sl_ie11_win8'
      ]
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('karma:coverage', function () {
  // Be sure to return the stream
  return gulp.src(paths.test)
    .pipe(karma({
      reporters: ['progress', 'coverage'],
      preprocessors: {
        // TODO: Use paths
        'src/**/*.js': ['coverage']
      },
      coverageReporter: {
        type: 'html',
        dir: 'coverage/'
      }
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('watch', function () {
  gulp.watch(['Gulpfile.js', paths.src, paths.test], ['jshint', 'bundle', 'karma:dev']);
});

gulp.task('bump', function () {
  throw 'TODO: Find & Configure a gulp plugin';
});

// Tasks
gulp.task('default', ['test']);
gulp.task('build', ['jshint', 'karma:continuous', 'bundle']);
gulp.task('test', ['karma:dev']);