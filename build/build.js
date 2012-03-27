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

console.log('\nBuilding pasteup:');

send_message('Compiling LESS to CSS');
compile_css();
send_message('Compiling JS');
compile_js();
send_message('Building module library');
build_module_library();
send_message('Building module pages');
build_module_pages();
console.log('======================');
console.log('Pasteup build complete');

function compile_css() {
    child_pr.exec("./compile_less", function(error, stdout, stderr) {
        console.log(stdout);
    });
}

function compile_js() {
    child_pr.exec("./compile_js", function(error, stdout, stderr) {
        if (error !== null) {
            console.error(error);
        }
    });
}

function build_module_library() {

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

function build_module_pages() {
    // Get module template.
    var template = fs.readFileSync(__dirname + '/' + TEMPLATE_DIR + '/module.html');

    // Get each module and create its own page in the docs.
    fs.readdirSync(__dirname + '/' + MODULE_DIR).forEach(function(name) {
        var f = fs.readFileSync(__dirname  + '/'  + MODULE_DIR + '/' + name, 'utf-8');
        var output = mustache.to_html(template.toString(), {'name':name, 'code':f});
        fs.writeFileSync(__dirname + '/' + MODULE_PAGES_DIR + '/' + name, output, 'utf-8');
    });
}

function send_message(message) {
    console.log(' * ' + message);
}