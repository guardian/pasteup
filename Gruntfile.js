/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    pasteup: {
      version: grunt.file.readJSON('bower.json').version,
      dist: "pasteup"
    },

    copy: {
      dist: {
        files: [
          {src: ['js/lib/**'], dest: '<%= pasteup.dist %>/'},
          {src: ['i/**'], dest: '<%= pasteup.dist %>/<%= pasteup.version %>/'}
        ]
      }
    },

    less: {
      production: {
        files: {
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/core.pasteup.min.css": "less/core.pasteup.less",
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/layout.pasteup.min.css": "less/layout.pasteup.less",
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/fonts.pasteup.min.css": "less/fonts.pasteup.less",
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/pasteup.min.css": "less/pasteup.less"
        },
        options: {
          compress: true
        }
      }
    },

    sass: {
      dist: {
        files: {
          "<%= pasteup.dist %>/<%= pasteup.version %>/css/responsive-layout.pasteup.min.css": "sass/layout/responsive-grid.scss"
        },
        options: {
          style: 'compressed'
        },
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
    },

    watch: {
      scripts: {
        files: 'js/**/*.js',
        tasks: ['requirejs']
      },
      less: {
        files: 'less/**/*.less',
        tasks: ['less']
      },
      docs: {
        files: ['build/templates/*.html', 'docs/**/*.html', 'html/**/*.html'],
        tasks: ['docs']
      }
    }

  });

  // Register the default task which does the full build.
  grunt.registerTask('default', ['less', 'requirejs', 'copy', 'docs', 'server', 'watch']);
  grunt.registerTask('build', ['less', 'requirejs', 'copy:dist', 'docs']);

  // Load tasks.
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadTasks('build');

};
