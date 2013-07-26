module.exports = function(grunt) {

  'use strict';

  var banner  = '//  <%= pkg.name %> <%= pkg.version%>\n';
  banner += '';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      // files: ['<%= jshint.files %>'],
      files: ['Gruntfile.js', 'src/**/*.js', 'test/specs/**/*.js'],
      tasks: ['jshint', 'shell:test']
    },

    concat: {
      options: {
        banner: banner
      },
      dist: {
        src: [
          'src/utils.js',
          'src/hoodie.js',

          'src/core/events.js',
          'src/core/promises.js',
          'src/core/request.js',
          'src/core/connection.js',
          'src/core/uuid.js',
          'src/core/dispose.js',
          'src/core/open.js',

          'src/core/store.js',
          'src/core/errors.js',
          'src/core/remote.js',

          'src/core/local_store.js',
          'src/core/config.js',
          'src/core/account.js',
          'src/core/account_remote.js'
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
        "src/**/*.js"
      ],
      options: {
        "out": "doc/",
        "whitespace-after-token": false
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
