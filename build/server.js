var fs = require('fs'),
	path = require('path'),
	express = require('express'),
	watch = require('nodewatch')
	build = require('./build');

// get command line arguments
var args = process.argv.slice(2),
	SERVER_PORT = args[0] ? args[0] : 3000,
	SERVER_HOST = args[1] ? args[1] : '0.0.0.0';

var app = express.createServer();
app.configure(function() {
	// thought we should only serve up JS and CSS for now
	// this will promote linking to the built files and not hashin in a hack to link to the less files
	// but perhaps this should be allowed
	app.use('/', express.static(__dirname + '/deployable_artefact'));
});

// watch and compile changes to LESS / JS
watch.add('../less', true)
	.add('../js', true)
	.add('../docs', true)
	.add('../html', true).onChange(function(file, prev, curr, action) {
    console.log('\n * ' + file + ' has been changed. Recompiling.\n');
    //build.lintJavaScript();
    build.go();
});

// Run a build before starting
//build.lintJavaScript();
build.go();

// run server
app.listen(SERVER_PORT, SERVER_HOST);
console.log('Pasteup running on http://%s:%d', SERVER_HOST, SERVER_PORT);