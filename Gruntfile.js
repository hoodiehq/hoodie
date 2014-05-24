module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({

    bump: {
      options: {
        commitMessage: 'chore(release): v%VERSION%',
        files: ['package.json'],
        commitFiles: [
          'package.json',
          'CHANGELOG.md'
        ],
        pushTo: 'origin master'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: 'jshint'
    },

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
      full: { src: ['test/runner.js'] }
    },

    nodeunit: {
      all: ['test/test-*.js']
    }

  });

  grunt.registerTask('release', function () {

    // Forward arguments to the bump-only task
    this.args.unshift('bump-only');

    grunt.task.run([
      'test',
      this.args.join(':'),
      'changelog',
      'bump-commit'
    ]);

  });

  // Default task.
  grunt.registerTask('default', [
    'jshint',
    'nodeunit:all',
    'simplemocha:full'
  ]);

  grunt.registerTask('test', [
    'jshint',
    'nodeunit:all',
    'simplemocha:full'
  ]);

};
