#!/usr/bin/env node

var fs       = require('fs'),
    child_pr = require('child_process'),
    async    = require('async'),
    mustache = require('mustache');

// Relative to build dir.
var TEMPLATE_DIR     = 'templates',
    MODULE_DIR       = '../content/module/',
    MODULE_LIB       = '../docs/modules.html',
    MODULE_PAGES_DIR = '../docs/modules/';


process.stdout.write('\nBuilding pasteup\n');
// Compile CSS and JS
compileAssets(function() {
    // And then build modules.
    buildModuleLibrarySync();
    buildModulePagesSync();
    process.stdout.write('\n======================');
    process.stdout.write('\nPasteup build complete\n\n');
    process.exit();
});

function compileAssets(callback) {
    async.parallel([
        function(callback) {
            process.stdout.write('\n * Compiling LESS to CSS');
            child_pr.exec("./compile_less", function(error, stdout, stderr) {
                if (error !== null) {
                    process.stdout.write(error);
                    process.exit();
                }
                callback();
            });
        },
        function(callback) {
            process.stdout.write('\n * Compiling JS');
            child_pr.exec("./compile_js", function(error, stdout, stderr) {
                if (error !== null) {
                    process.stdout.write(error);
                    process.exit();
                }
                callback();
            });
        }
    ],
    function(err, results) {
        callback();
    })
}

/*
Get all the modules in /content/modules,
and add them all to the module library doc.
*/
function buildModuleLibrarySync() {
    process.stdout.write('\n * Building module library');
    var modules = [];
    fs.readdirSync(__dirname + '/' + MODULE_DIR).forEach(function(name) {
        var f = fs.readFileSync(__dirname  + '/'  + MODULE_DIR + '/' + name, 'utf-8');
        modules.push({
            'name': name,
            'code': f
        });
    });

    // Get template file, and render modules into template.
    var template = fs.readFileSync(__dirname + '/' + TEMPLATE_DIR + '/library.html');
    var output = mustache.to_html(template.toString(), {'modules': modules});
    fs.writeFileSync(__dirname + '/' + MODULE_LIB, output, 'utf-8');
}

/*
Get all the modules in /content/modules,
and create a page for each on in doc/modules.
*/
function buildModulePagesSync() {
    process.stdout.write('\n * Building module pages');
    // Get module template.
    var template = fs.readFileSync(__dirname + '/' + TEMPLATE_DIR + '/module.html');

    // Get each module and create its own page in the docs.
    fs.readdirSync(__dirname + '/' + MODULE_DIR).forEach(function(name) {
        var f = fs.readFileSync(__dirname  + '/'  + MODULE_DIR + '/' + name, 'utf-8');
        var output = mustache.to_html(template.toString(), {'name':name, 'code':f});
        fs.writeFileSync(__dirname + '/' + MODULE_PAGES_DIR + '/' + name, output, 'utf-8');
    });
}
