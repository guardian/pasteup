var fs        = require('fs'),
    child_pr  = require('child_process'),
    async     = require('async'),
    mustache  = require('mustache'),
    wrench	  = require('wrench'),
    requirejs = require('requirejs'),
    less      = require('less'),
    jshint    = require('jshint').JSHINT,
    csslint   = require('csslint').CSSLint,
    njson	  = require('norris-json').make(),
    path      = require('path');

var build = {
	TEMPLATE_DIR: 'templates',
	DOCS_DIR: '../docs',
	ARTEFACT_DIR: 'tmp_artefact',
    MODULE_DIR: '../html/module',
    MODULE_LIB: 'modules.html',
    MODULE_PAGES_DIR: 'modules',

    go: function() {
    	process.stdout.write('\nBuilding pasteup\n');

    	child_pr.exec('rm -rf ' + __dirname + '/' + build.ARTEFACT_DIR, function() {
            fs.mkdirSync(__dirname + '/' + build.ARTEFACT_DIR, '0777');
    		process.stdout.write('\nCreating artefact dir\n');
    		async.parallel([
			build.buildDocumentationPages,
			build.compileJS,
			build.compileCSS,
			build.buildModuleLibrary,
			build.buildModulePages
			], function() {
				process.stdout.write('\n======================');
			    process.stdout.write('\nPasteup build complete\n\n');
			});
        });
	},

	/*
	LESS compression
	a bit odd as we have to loop through the LESS files to do it
	TODO: see if there is a way to build in this compiler similar r.js
	*/
	compileCSS: function(callback) {
		process.stdout.write('\n * Compiling and optimising LESS to CSS');
		fs.mkdirSync(__dirname + '/' + build.ARTEFACT_DIR + '/css', '0777');
		// get the less files
		var less_dir = '../less';
		var less_files = fs.readdirSync(less_dir).filter(function(name) { return /\.less$/.test(name); });
		less_files.forEach(function(name) {
			var filename = less_dir + '/' + name,
				out_filename = __dirname + '/' + build.ARTEFACT_DIR + '/css/' + name.replace('.less', '.css'),
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
				});
			});
		});
		callback();
	},

	/*
	Use require JS to compile and optimise JS
	*/
	compileJS: function(callback) {
		wrench.copyDirSyncRecursive('../js', __dirname + '/' + build.ARTEFACT_DIR + '/js');
    	process.stdout.write('\n * Compiling and optimising JS');
		var config = {
		    baseUrl: __dirname + '/' + build.ARTEFACT_DIR + '/js',
		    name: 'main',
		    out: __dirname + '/' + build.ARTEFACT_DIR + '/js/main.min.js'
		};

		requirejs.optimize(config, function(buildResponse) {
			var contents = fs.readFileSync(config.out, 'utf8');
			callback();
		});
    },

    /* 
    Get all the documentation pages,
	and build their HTML files.
	*/
    buildDocumentationPages: function(callback) {
    	process.stdout.write('\n * Building documentation pages');
    	var template = fs.readFileSync(__dirname + '/' + build.TEMPLATE_DIR + '/default.html');

    	fs.readdirSync(__dirname + '/' + build.DOCS_DIR).forEach(function(name) {
    		var f = fs.readFileSync(__dirname + '/' + build.DOCS_DIR + '/' + name, 'utf8');
    		var output = mustache.to_html(template.toString(), {'name':name, 'code':f});
	        fs.writeFileSync(__dirname + '/' + build.ARTEFACT_DIR + '/' + name, output, 'utf8');
    	});
    },

	/*
	Get all the modules in /html/modules,
	and add them all to the module library doc.
	*/
	buildModuleLibrary: function(callback) {
	    process.stdout.write('\n * Building module library');
	    var modules = [];
	    fs.readdirSync(__dirname + '/' + build.MODULE_DIR).forEach(function(name) {
	    	var f = fs.readFileSync(__dirname  + '/'  + build.MODULE_DIR + '/' + name, 'utf8');
	        modules.push({
	            'name': name,
	            'code': f
	        });
	    });
	    
	    // Get template file, and render modules into template.
	    var template = fs.readFileSync(__dirname + '/' + build.TEMPLATE_DIR + '/library.html');
	    var output = mustache.to_html(template.toString(), {'modules': modules});
	    fs.writeFileSync(__dirname + '/tmp_artefact/' + build.MODULE_LIB, output, 'utf8');
	    callback();
	},

	/*
	Get all the modules in /html/modules,
	and create a page for each on in doc/modules.
	*/
	buildModulePages: function (callback) {
	    process.stdout.write('\n * Building module pages');
	    fs.mkdirSync(__dirname + '/' + build.ARTEFACT_DIR + '/modules', '0777');
	    // Get module template.
	    var template = fs.readFileSync(__dirname + '/' + build.TEMPLATE_DIR + '/module.html');

	    // Get each module and create its own page in the docs.
	    fs.readdirSync(__dirname + '/' + build.MODULE_DIR).forEach(function(name) {
	        var f = fs.readFileSync(__dirname  + '/'  + build.MODULE_DIR + '/' + name, 'utf8');
	        var output = mustache.to_html(template.toString(), {'name':name, 'code':f});
	        fs.writeFileSync(__dirname + '/tmp_artefact/' + build.MODULE_PAGES_DIR + '/' + name, output, 'utf8');
	    });
	    callback();
	},

	lintJavaScript: function () {
        var config_json = njson.loadSync('jshint_config.json'); // Using njson because it strips comments from JSON file.
        wrench.readdirSyncRecursive('../../js').forEach(function(name) {
            if (name.indexOf('lib/') !== 0 &&
                name.indexOf('.min.js') === -1 &&
                name.indexOf('.js') !== -1) {
                var f = fs.readFileSync('../../js/' + name, 'utf8');
                var result = jshint(f, config_json);
                if (result === false) {
                    console.log('\nFile:  ',name);
                    console.log("------------------------");
                    build.printJSHintErrors(jshint.errors);
                }
            }
        })
    },

    lintCss: function() {
        var config_json = njson.loadSync('csslint_config.json'); // Using njson because it strips comments from JSON file.
        wrench.readdirSyncRecursive('../static/css').forEach(function(name) {
            var f = fs.readFileSync('../static/css/' + name, 'utf8');
            var result = csslint.verify(f, config_json);
            console.log(name);
            console.log(result);
        });
    },

    printJSHintErrors: function(errors) {
    	for (var i = 0, j = errors.length; i<j; ++i) {
    		var error = errors[i];
    		console.log('Error: ', error.reason);
    		console.log('        Line: ', error.line);
    		console.log('        Char: ', error.character);
    	}
    }

}

module.exports = build;

if (!module.parent) {
	//build.lintJavaScript();
	build.go();
	//build.lintCss();
}