module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    grunt.initConfig({
        sass: {
            dev: {
                files:  [{
                    'styleguide/style.css' : 'src/pasteup.scss'
                }]
            }
        },
        watch: {
            dev: {
                files: ['src/**/*.scss'],
                tasks: ['sass:dev']
            }
        }
    });

    grunt.registerTask('dev', ['watch:dev']);
};
