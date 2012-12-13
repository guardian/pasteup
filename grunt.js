/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({


    pasteup: {
      version: grunt.file.readJSON('versions').versions.pop(),
      dist: "build/deployable_artefact"
    },

    copy: {
      dist: {
        files: {
          "<%= pasteup.dist %>/js/lib/": "js/lib/**"
        }
      }
    },
less
    : {
      production: {
        files: {
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/core.pasteup.min.css": "less/core.pasteup.less",
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/layout.pasteup.min.css": "less/layout.pasteup.less",
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/pasteup.min.css": "less/pasteup.less"
        },
        options: {
          compress: true
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: "js/modules",
          dir: "<%= pasteup.dist %>/<%= pasteup.version %>/js/modules",
          modules: [
            {
              name: "main"
            }
          ]
        }
      }
    }

  });

  // Register the default task which does everything.
  grunt.registerTask('default', 'less requirejs copy docs');

  // Load contrib tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadTasks('build');


  //Register custom task for running server.
  var connect = require('connect');
  grunt.registerTask('server', 'Start a static web server on localhost:3000', function() {
    grunt.log.subhead('Starting development server');
    grunt.log.writeln('Port: 3000');
    connect(connect.static(grunt.config.get('pasteup.dist'))).listen(3000);
    this.async();
  });

};
