module.exports = function(grunt) {

  'use strict';

  var banner = '// <%= pkg.title %> - <%= pkg.version%>\n';
  banner += '// https://github.com/hoodiehq/hoodie.js\n';
  banner += '// Copyright 2012 - 2014 https://github.com/hoodiehq/\n';
  banner += '// Licensed Apache License 2.0\n';
  banner += '\n';

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
          sl_firefox_win7: {
            base: 'SauceLabs',
            platform: 'Windows 7',
            browserName: 'Firefox'
          },
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
        browsers: ['PhantomJS', 'sl_chrome_mac', 'sl_safari_mac', 'sl_firefox_win7',
        // 'sl_ie10_win7',
        // 'sl_ie11_win8'
        ]
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
      versions: {
        options: {
          files: ['package.json', 'bower.json'],
          updateConfigs: ['pkg'],
          pushTo: 'origin',
          commit: true,
          commitMessage: 'Release %VERSION%',
          commitFiles: '-a', // '-a' for all files
          createTag: true,
          tagName: '%VERSION%',
          tagMessage: 'Version %VERSION%'
        }
      }
    }
  });

  // load all tasks defined in node_modules starting with 'grunt-'
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['test']);
  grunt.registerTask('build', ['jshint', 'karma:continuous', 'browserify:build', 'concat', 'uglify']);
  grunt.registerTask('test', ['karma:dev']);
};
