module.exports = function(grunt) {

  'use strict';

  var banner = '// <%= pkg.title %> - <%= pkg.version%>\n';
  banner += '// https://github.com/hoodiehq/hoodie.js\n';
  banner += '// Copyright 2012, 2013 https://github.com/hoodiehq/\n';
  banner += '// Licensed Apache License 2.0\n';
  banner += '\n';
  banner += '(function(global) {\n';
  banner += '\'use strict\'\n';
  banner += '\n';

  var footer  = '\n';
  footer += '})(window);\n';


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js','test/specs/**/*.js' ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'karma:dev']
    },

    concat: {
      options: {
        banner: banner,
        footer: footer
      },
      dist: {
        src: [
          'src/hoodie.js',

          'src/hoodie/events.js',
          'src/hoodie/promises.js',
          'src/hoodie/request.js',
          'src/hoodie/connection.js',
          'src/hoodie/generate_id.js',
          'src/hoodie/dispose.js',
          'src/hoodie/open.js',

          'src/hoodie/store.js',
          'src/hoodie/scoped_store.js',
          'src/hoodie/errors.js',
          'src/hoodie/remote_store.js',

          'src/hoodie/local_store.js',
          'src/hoodie/config.js',
          'src/hoodie/account.js',
          'src/hoodie/account_remote.js',
          'src/hoodie/task.js',
          'src/hoodie/scoped_task.js'
        ],
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

    groc: {
      javascript: [
        'src/**/*.js'
      ],
      options: {
        'out': 'doc/',
        'whitespace-after-token': false
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS']
      },

      continuous: {
        singleRun: true,
        browsers: ['PhantomJS'],
        sauceLabs: {
          username: 'svnlto',
          accessKey: '104fe381-851b-485f-81d6-8eda57d0e40e',
          startConnect: true,
          testName: 'hoodie.js test'
        },
        customLaunchers: {
          sl_chrome_linux: {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'linux'
          }
        }
      },

      dev: {
        browsers: ['PhantomJS', 'Chrome', 'ChromeCanary']
      },

      coverage: {
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'src/**/*.js': ['coverage']
        },
        coverageReporter: {
          type : 'html',
          dir : 'coverage/'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-groc');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('build', ['jshint', 'karma:dev', 'concat', 'uglify']);
  grunt.registerTask('test', ['karma:dev']);
  grunt.registerTask('docs', ['groc']);
};
