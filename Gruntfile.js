module.exports = function(grunt) {

  'use strict';

  require('load-grunt-tasks')(grunt);

  var banner = '// <%= pkg.title %> - <%= pkg.version%>\n' +
    '// https://github.com/hoodiehq/hoodie.js\n' +
    '// Copyright 2012 - 2014 https://github.com/hoodiehq/\n' +
    '// Licensed Apache License 2.0\n\n';

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
      tasks: ['browserify:dev', 'karma:dev', 'jshint']
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
      dev: {
        browsers: ['PhantomJS']
      }
    },

    browserify: {
      dev: {
        src: ['src/hoodie.js'],
        dest: 'dist/hoodie.js',
        options: {
          bundleOptions: {
            standalone: 'Hoodie',
            debug: true
          },
          external: 'jquery'
        }
      },
      build: {
        src: ['src/hoodie.js'],
        dest: 'dist/hoodie.js',
        options: {
          bundleOptions: {
            standalone: 'Hoodie'
          },
          external: 'jquery'
        }
      }
    },

    release: {
      tasks: ['karma:dev', 'refresh', 'build', 'changelog']
    }
  });

  // refresh package information
  grunt.registerTask('refresh', function() {
    grunt.config.set('pkg', grunt.file.readJSON('package.json'));
  });

  grunt.registerTask('build', ['browserify:build', 'concat', 'uglify']);
  grunt.registerTask('test', ['jshint', 'karma:dev', 'build']);
  grunt.registerTask('ci', ['test', 'integration-test']);
  grunt.registerTask('default', ['build']);
};
