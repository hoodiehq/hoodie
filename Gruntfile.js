module.exports = function(grunt) {

  'use strict';

  require('load-grunt-tasks')(grunt);

  var banner = '// <%= pkg.title %> - <%= pkg.version%>\n' +
    '// https://github.com/hoodiehq/hoodie.js\n' +
    '// Copyright 2012 - 2014 https://github.com/hoodiehq/\n' +
    '// Licensed Apache License 2.0\n\n';

  var customLaunchers = {
    sl_chrome_mac: {
      base: 'SauceLabs',
      platform: 'mac 10.8',
      browserName: 'chrome'
    },
    sl_safari_mac: {
      base: 'SauceLabs',
      platform: 'mac 10.8',
      browserName: 'safari'
    }//,
    // sl_firefox_win7: {
    //   base: 'SauceLabs',
    //   platform: 'Windows 7',
    //   browserName: 'Firefox'
    // },
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
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/specs/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'browserify:dev', 'karma:dev']
    },

    concat: {
      options: {
        banner: banner
      },
      dist: {
        src: ['dist/hoodie.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        banner: banner
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS']
      },

      continuous: {
        singleRun: true,
        sauceLabs: {
          tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
          testName: 'hoodie.js test',
        },
        customLaunchers: customLaunchers,
        browsers: Object.keys(customLaunchers),
        reporters: ['progress', 'saucelabs']
      },

      dev: {
        browsers: ['PhantomJS']
      },

      coverage: {
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'src/**/*.js': ['coverage']
        },
        coverageReporter: {
          type: 'html',
          dir: 'coverage/'
        }
      }
    },

    browserify: {
      dev: {
        src: ['src/hoodie.js'],
        dest: 'dist/hoodie.js',
        options: {
          external: 'jquery',
          standalone: 'Hoodie',
          debug: true
        }
      },
      build: {
        src: ['src/hoodie.js'],
        dest: 'dist/hoodie.js',
        options: {
          external: 'jquery',
          standalone: 'Hoodie'
        }
      }
    },

    // https://github.com/vojtajina/grunt-bump
    // bump version of hoodie.js
    bump: {
      options: {
        commitMessage: 'chore(release): v%VERSION%',
        files: [
          'bower.json',
          'package.json'
        ],
        commitFiles: [
          'dist/*',
          'bower.json',
          'package.json',
          'CHANGELOG.md'
        ],
        pushTo: 'origin master'
      }
    }

  });

  grunt.registerTask('release', function() {

    // forward arguments to the bump-only task
    this.args.unshift('bump-only');

    // refresh package information
    grunt.registerTask('refresh', function() {
      grunt.config.set('pkg', grunt.file.readJSON('package.json'));
    });

    grunt.task.run([
      'karma:dev',
      this.args.join(':'),
      'refresh',
      'build',
      'changelog',
      'bump-commit'
    ]);

  });

  grunt.registerTask('build', ['browserify:build', 'concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'karma:continuous', 'build']);
  grunt.registerTask('default', ['build']);

};
