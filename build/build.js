var fs        = require('fs'),
    child_pr  = require('child_process'),
    async     = require('async'),
    wrench	  = require('wrench'),
    mustache  = require('mustache'),
    requirejs = require('requirejs'),
    less      = require('less'),
    path      = require('path');

var BASE_DIR			= __dirname + '/..',
	TEMPLATE_DIR 		= BASE_DIR + '/build/templates',
	DOCS_DIR 			= BASE_DIR + '/docs',
	ARTEFACT_DIR		= __dirname + '/deployable_artefact',
    MODULE_DIR 			= BASE_DIR + '/html/module',
    MODULE_LIB			= ARTEFACT_DIR + '/modules.html',
    MODULE_PAGES_DIR	= ARTEFACT_DIR + '/modules',
    VERSIONS 			= BASE_DIR + '/versions';

var v;

var build = {

    go: function() {
    	var start = (new Date());
    	console.log('\nPASTEUP BUILD');
    	console.log('==================================');
    	v = build.getVersionNumber();
    	child_pr.exec('rm -rf ' + ARTEFACT_DIR, function() {
    		console.log(' * Creating tmp build directories');
            fs.mkdirSync(ARTEFACT_DIR, '0777');
			fs.mkdirSync(ARTEFACT_DIR + '/' + v, '0777');
    		async.parallel([
    			build.compileCSS,
				build.compileJS,
				build.buildDocumentationPages,
				build.buildModuleLibrary,
				build.buildModulePages,
				build.copyVersionFile,
			], function(err, results) {
				// Gzip the file for TC.
				child_pr.exec('zip -r deployable_artefact.zip deployable_artefact/', function() {
					console.log('\n----------------------------------');
			    	console.log('Pasteup build complete: ' + (new Date()-start) + 'ms\n');
			    	process.exit(code=0);
				});
			});
        });
	},

	/*
	LESS compression
	a bit odd as we have to loop through the LESS files to do it
	TODO: see if there is a way to build in this compiler similar r.js
	*/
	compileCSS: function(callback) {
		var start = (new Date());
		fs.mkdirSync(ARTEFACT_DIR + '/css', '0777');
		// get the less files
		var less_dir = '../less';
		var less_files = fs.readdirSync(less_dir).filter(function(name) { return /\.less$/.test(name); });

		async.forEach(less_files, function(name, callback) {
			var filename = less_dir + '/' + name,
				out_filename = ARTEFACT_DIR + '/css/' + name.replace('.less', '.css'),
				out_filename_compressed = out_filename.replace('.css', '.min.css');

			// read the file's content
			fs.readFile(filename, 'utf8', function(e, data) {
				// now parse the content as a string through less
				new(less.Parser)({
					paths: [path.dirname(filename)],
					filename: filename
				}).parse(data, function(err, tree) {
					var css = tree.toCSS(),
						css_compressed = tree.toCSS({ compress: true }),
						fd = fs.openSync(out_filename, 'w'),
						fd_compressed = fs.openSync(out_filename_compressed, 'w');

					// write out both compressed and normal CSS
					fs.writeSync(fd, css, 0, 'utf8');
					fs.writeSync(fd_compressed, css_compressed, 0, 'utf8');
					callback();
				});
			});
		}, function() {
			wrench.copyDirSyncRecursive(ARTEFACT_DIR + '/css', ARTEFACT_DIR + '/' + v + '/css');
			console.log(' * compileCSS: ' + (new Date()-start) + 'ms');
			callback(null, 'compileCSS');
		});
	},

	/*
	Use require JS to compile and optimise JS
	*/
	compileJS: function(callback) {
		var start = (new Date());
		wrench.copyDirSyncRecursive('../js', ARTEFACT_DIR + '/js');
		var config = {
		    baseUrl: ARTEFACT_DIR + '/js',
		    name: 'main',
		    out: ARTEFACT_DIR + '/js/main.min.js'
		};
		requirejs.optimize(config, function(buildResponse) {
			// Move the JS to versioned directory.
			wrench.copyDirSyncRecursive(ARTEFACT_DIR + '/js', ARTEFACT_DIR + '/' + v + '/js');
			// Remove the JS libs from versioned directory.
			child_pr.exec('rm -rf ' + ARTEFACT_DIR + '/' + v + '/js/lib', function() {
				console.log(' * compileJS: ' + (new Date()-start) + 'ms');
				callback(null, "compileJS");
			});
		});
    },

    /* 
    Get all the documentation pages,
	and build their HTML files.
	*/
    buildDocumentationPages: function(callback) {
    	var start = (new Date());
    	var template = fs.readFileSync(TEMPLATE_DIR + '/default.html').toString();

    	async.forEach(fs.readdirSync(DOCS_DIR), function(name, callback) {
    		fs.readFile(DOCS_DIR + '/' + name, 'utf8', function(err, f) {
    			var output = mustache.to_html(template, {'name':name, 'code':f});
	        	fs.writeFile(ARTEFACT_DIR + '/' + name, output, 'utf8', function() {
	        		callback();
	        	});
    		});
    	}, function() {
    		console.log(' * buildDocumentationPages: ' + (new Date()-start) + 'ms');
    		callback(null, "buildDocumentationPages");
    	});
    },

	/*
	Get all the modules in /html/modules,
	and add them all to the module library doc.
	*/
	buildModuleLibrary: function(callback) {
	    var start = (new Date());
	    var modules = [];

	    async.forEach(fs.readdirSync(MODULE_DIR), function(name, callback) {
	    	fs.readFile(MODULE_DIR + '/' + name, 'utf8', function(err, f) {
	    		modules.push({
			        'name': name,
			        'code': f
			    });
			    callback();
	    	});
    	}, function() {
			// Get template file, and render modules into template.
			var template = fs.readFileSync(TEMPLATE_DIR + '/library.html');
		    var output = mustache.to_html(template.toString(), {'modules': modules});
		    fs.writeFileSync(MODULE_LIB, output, 'utf8');
		    console.log(' * buildModuleLibrary: ' + (new Date()-start) + 'ms');
		    callback(null, "buildModuleLibrary");
		});
	},

	/*
	Get all the modules in /html/modules,
	and create a page for each one in doc/modules.
	*/
	buildModulePages: function (callback) {
	    var start = (new Date());
	    fs.mkdirSync(ARTEFACT_DIR + '/modules', '0777');
	    // Get module template.
	    var template = fs.readFileSync(TEMPLATE_DIR + '/module.html').toString();

	    // Get each module and create its own page in the docs.
	    async.forEach(fs.readdirSync(MODULE_DIR), function(name, callback) {
	    	fs.readFile(MODULE_DIR + '/' + name, 'utf8', function(err, f) {
	    		var output = mustache.to_html(template, {'name': name, 'code': f});
	    		fs.writeFile(MODULE_PAGES_DIR + '/' + name, output, 'utf8', function() {
	    			callback();
	    		});
	    	});
	    }, function() {
	    	console.log(' * buildModulePages: ' + (new Date()-start) + 'ms');
	    	callback(null, "buildModulePages");
	    });
	},

	copyVersionFile: function(callback) {
		fs.writeFileSync(ARTEFACT_DIR + '/versions', fs.readFileSync(VERSIONS));
		callback(null, "copyVersionFile");
	},

    getVersionNumber: function() {
	    var f = fs.readFileSync(VERSIONS, 'utf8');
	    var data = JSON.parse(f.toString());
	    return data['versions'].pop();
	}
}

module.exports = build;

if (!module.parent) {
	//lint.lintJavaScript();
	build.go();
	//lint.lintCss();
}