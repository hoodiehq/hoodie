module.exports = function(grunt) {

  'use strict';

  var banner  = '//  <%= pkg.name %> <%= pkg.version%>\n';
  banner += '';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: banner
      },
      dist: {
        src: [
          'src/utils.js',
          'src/events.js',
          'src/hoodie.js',
          'src/core/account.js',
          'src/core/config.js',
          'src/core/email.js',
          'src/core/errors.js',
          'src/core/store.js',
          'src/core/remote.js',
          'src/core/account_remote.js',
          'src/core/local_store.js',
          'src/extensions/share.js',
          'src/extensions/user.js',
          'src/extensions/global.js',
          'src/extensions/share_instance.js'
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

    jshint: {
      files: ['gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['concat']
    },

    groc: {
      javascript: [
        "src/**/*.js"
      ],
      options: {
        "out": "docs/"
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-groc');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
  grunt.registerTask('docs', ['groc']);
};
