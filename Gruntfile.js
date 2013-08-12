module.exports = function(grunt) {

  'use strict';

  var banner  = '\n// <%= pkg.title %> - <%= pkg.version%>\n';
  banner += '// https://github.com/hoodiehq/hoodie.js\n';
  banner += '// Copyright 2012, 2013 https://github.com/hoodiehq/.';
  banner += ' and other contributors; Licensed Apache License 2.0\n';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js','test/specs/**/*.js' ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      //files: ['<%= jshint.files %>'],
      files: ['Gruntfile.js', 'src/**/*.js'],
      tasks: ['jshint', 'shell:test']
    },

    concat: {
      options: {
        banner: banner
      },
      dist: {
        src: [
          'src/hoodie.js',

          'src/hoodie/events.js',
          'src/hoodie/promises.js',
          'src/hoodie/request.js',
          'src/hoodie/connection.js',
          'src/hoodie/uuid.js',
          'src/hoodie/dispose.js',
          'src/hoodie/open.js',

          'src/hoodie/store.js',
          'src/hoodie/errors.js',
          'src/hoodie/remote_store.js',

          'src/hoodie/local_store.js',
          'src/hoodie/config.js',
          'src/hoodie/account.js',
          'src/hoodie/account_remote.js'
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

    shell: {
      test: {
        command: 'node node_modules/karma/bin/karma start',
        options: {
          stdout: true,
          stderr: true
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-groc');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('build', ['jshint', 'shell:test', 'concat', 'uglify']);
  grunt.registerTask('test', ['shell:test']);
  grunt.registerTask('docs', ['groc']);
};
