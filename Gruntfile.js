module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');

  // Project configuration.
  grunt.initConfig({

    jshint: {
      files: [
        'Gruntfile.js',
        'lib/**/*.js',
        'bin/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    simplemocha: {
      options: {
        reporter: 'spec',
        ignoreLeaks: true
      },
      full: { src: ['test/**/*-test.js'] }
    },

    watch: {
      files: ['<config:jshint.files>'],
      tasks: 'jshint'
    }

  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'simplemocha:full']);
  grunt.registerTask('test', ['jshint', 'simplemocha:full']);
};
