module.exports = function(grunt) {

  'use strict';

  require('load-grunt-tasks')(grunt);

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
      tasks: [/*'karma:dev', */'jshint']
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

    release: {
      tasks: [/*'karma:dev', */'refresh', 'changelog']
    }
  });

  // refresh package information
  grunt.registerTask('refresh', function() {
    grunt.config.set('pkg', grunt.file.readJSON('package.json'));
  });

  grunt.registerTask('test', ['jshint'/*, 'karma:dev'*/]);
  grunt.registerTask('ci', ['test', 'integration-test']);
  grunt.registerTask('default', ['test']);
};
