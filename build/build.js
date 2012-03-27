#!/usr/bin/env node

var fs       = require('fs'),
    child_pr = require('child_process'),
    mustache = require('mustache'),
    less     = require('less'),
    r        = require('requirejs');

var TEMPLATE_DIR     = 'templates',
    MODULE_DIR       = '../content/module/',
    MODULE_LIB       = '../docs/modules.html',
    MODULE_PAGES_DIR = '../docs/modules/';

/* Check the build number and confirm it's correct. */
process.stdout.write('\nAbout to build pasteup. Version: ' + getVersionNumber());
process.stdout.write('\nIs this the correct build number? (y/n)');
var stdin = process.openStdin();
stdin.setEncoding('utf8');
stdin.once('data', function(val) {
    if (val.trim() === 'y') {
        doBuild();
    } else {
        process.stdout.write("\nUpdate the build number in /version\n\n");
    }
    process.exit();
}).resume();


function doBuild() {
    sendMessage('Compiling LESS to CSS');
    compileCss();
    sendMessage('Compiling JS');
    compileJs();
    sendMessage('Building module library');
    buildModuleLibrary();
    sendMessage('Building module pages');
    buildModulePages();
    process.stdout.write('\n======================');
    process.stdout.write('\nPasteup build complete\n\n');
}

function compileCss() {
    child_pr.exec("./compile_less", function(error, stdout, stderr) {
        process.stdout.write(stdout);
    });
}

function compileJs() {
    child_pr.exec("./compile_js", function(error, stdout, stderr) {
        if (error !== null) {
            process.stdout.error(error);
        }
    });
}

/*
Returns the most recent version number in /version
*/
function getVersionNumber() {
    var f = fs.readFileSync(__dirname  + '/../version', 'utf-8');
    var data = JSON.parse(f.toString());
    return data['versions'].pop();
}

/*
Get all the modules in /content/modules,
and add them all to the module library doc.
*/
function buildModuleLibrary() {

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
function buildModulePages() {
    // Get module template.
    var template = fs.readFileSync(__dirname + '/' + TEMPLATE_DIR + '/module.html');

    // Get each module and create its own page in the docs.
    fs.readdirSync(__dirname + '/' + MODULE_DIR).forEach(function(name) {
        var f = fs.readFileSync(__dirname  + '/'  + MODULE_DIR + '/' + name, 'utf-8');
        var output = mustache.to_html(template.toString(), {'name':name, 'code':f});
        fs.writeFileSync(__dirname + '/' + MODULE_PAGES_DIR + '/' + name, output, 'utf-8');
    });
}

function sendMessage(message) {
    process.stdout.write('\n * ' + message);
}
