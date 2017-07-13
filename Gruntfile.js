module.exports = function(grunt) {


  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      ts: {
      build: {
          src: ["lib/**/*.ts", "test/**/*.ts", "!node_modules/**/*.ts"],
          // Avoid compiling TypeScript files in node_modules
          options: {

              target: 'es6',
              // To compile TypeScript using external modules like NodeJS
              module: 'commonjs',
              allowJs: true,
          }
        }
      },
      mochaTest: {
        test: {
          options: {
            reporter: 'spec',
            quiet: false, // Optionally suppress output to standard out (defaults to false)
            clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
          },
          src: ['test/**/*.js']
        }
      },
      watch: {
        ts: {
          files: ['./**/*.ts'],
          tasks: ['ts:build', 'mochaTest']
        },
      }
  });
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['ts:build', 'mochaTest']);

};
