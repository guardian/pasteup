module.exports = function(grunt) {

	var async	= require('async'),
  		fs		= require('fs');

  var version = grunt.config.get("pasteup.version").toString();
  var deployableDir = grunt.config.get("pasteup.dist").toString();

	function buildDocumentationPages(cb) {
	  var template = grunt.file.read('build/templates/default.html');
	  async.forEach(fs.readdirSync('docs'), function(name, cb) {
	    var ft = grunt.file.read('docs/' + name, 'utf8');
	    var f = grunt.template.process(ft.toString(), { data: {'pasteupVersion': version} });
	    var output = grunt.template.process(template, { data: {'name':name, 'code':ft, 'pasteupVersion': version} });
	    grunt.file.write(deployableDir + '/' + name, output);
	    cb();
	  }, function() {
	    cb();
	  });
	}

	function buildModuleLibrary(cb) {
	  var modules = [];
	  var template = grunt.file.read('build/templates/default.html');
	  var moduleTemplate = grunt.file.read('build/templates/library.html');
	  async.forEach(fs.readdirSync('html/module'), function(name, cb) {
	    var module = grunt.file.read('html/module/' + name, 'utf8');
	    modules.push({
	      'name': name,
	      'code': module
	    });
	    cb();
	  }, function() {
	    // Render modules into template.
	    var moduleCode = grunt.template.process(moduleTemplate, { data: {'modules': modules} });
	    var output = grunt.template.process(template, { data: {'code': moduleCode, 'pasteupVersion': version} })
	    grunt.file.write(deployableDir + '/modules.html', output);
	    cb();
	  });
	}

	function buildModulePages(cb) {
	  var template = grunt.file.read('build/templates/module.html');

	  // Get each module and create its own page in the docs.
	  async.forEach(fs.readdirSync('html/module'), function(name, cb) {
	    var module = grunt.file.read('html/module/' + name, 'utf8');
	    var output = grunt.template.process(template, { data: {'name': name, 'code': module, 'pasteupVersion': version} });
	    grunt.file.write(deployableDir + '/modules/' + name, output);
	    cb();
	  }, function() {
	    cb();
	  });
	}

  grunt.registerTask('docs', 'Build the documentation pages.', function() {
    grunt.log.subhead('Building documentation pages');
    grunt.file.mkdir(deployableDir+ "/modules");

    async.parallel([
      buildDocumentationPages,
      buildModuleLibrary,
      buildModulePages
    ], function(err, results) {
      grunt.log.writeln('Docs build complete.');
    });
  });


}

