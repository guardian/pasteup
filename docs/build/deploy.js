#!/usr/bin/env node

/* 
    Deploy pasteup files to S3.
    This script depends on s3cmd configured with appropriate Amazon S3 access credentials. */

var fs       = require('fs'),
    child_pr = require('child_process'),
    mustache = require('mustache'),
    wrench   = require('wrench'),
    async    = require('async');


var s3bucket  = 'pasteup',
    tmp_dir   = '../../deploy_tmp',
    tmp_v_dir = '../../deploy_tmp_'+ getVersionNumber();

var s3_sync_cmd = 's3cmd sync\
                     --recursive\
                     --acl-public\
                     --guess-mime-type\
                    {{#gzip}} --add-header "Content-Encoding: gzip" {{/gzip}}\
                     --add-header "Expires: {{expiry_date}}"\
                      {{directory}} s3://{{s3bucket}}{{s3dir}}';

/* Check the build number we're about to deploy */
process.stdout.write('\nYou are deploying version: ' + getVersionNumber());
process.stdout.write('\nIs this the correct version number? (y/n)\n');
var stdin = process.openStdin();
stdin.setEncoding('utf8');
stdin.once('data', function(val) {
    if (val.trim() === 'y') {
        doDeploy();
    } else {
        process.stdout.write("\nSo update the version number in ../../version\n\n");
        process.exit();
    }
}).resume();

function doDeploy() {
    copyPasteupTo(tmp_dir);
    copyPasteupTo(tmp_v_dir);

    gzipCssAndJs(function() {
        // After files are gzipped...
        sendDeployCommands(function() {
            // Finally remove all the temp dirs and exit.
            child_pr.exec('rm -rf ' + tmp_dir, function() {
                child_pr.exec('rm -rf ' + tmp_v_dir, function() {
                    process.exit();
                });
            });
        });
    });
}

function sendDeployCommands(callback) {
    var version = getVersionNumber();
    async.parallel([
        function(callback) {
            deploy(
                mustache.to_html(s3_sync_cmd, {
                    'directory': tmp_dir + '/docs',
                    's3bucket': s3bucket,
                    's3dir': '/',
                    'expiry_date': getNearFutureExpiryDate()
                }),
                function() { 
                    callback();
                }
            );
        },
        function(callback) {
            deploy(
                mustache.to_html(s3_sync_cmd, {
                    'directory': tmp_dir + '/js',
                    's3bucket': s3bucket,
                    's3dir': '/',
                    'expiry_date': getNearFutureExpiryDate(),
                    'gzip': true
                }),
                function() { 
                    callback();
                }
            );
        },
        function(callback) {
            deploy(
                mustache.to_html(s3_sync_cmd, {
                    'directory': tmp_dir + '/js',
                    's3bucket': s3bucket,
                    's3dir': '/' + version + '/',
                    'expiry_date': getFarFutureExpiryDate(),
                    'gzip': true
                }),
                function() { 
                    callback();
                }
            );
        },
        function(callback) {
            deploy(
                mustache.to_html(s3_sync_cmd, {
                    'directory': tmp_dir + '/css',
                    's3bucket': s3bucket,
                    's3dir': '/',
                    'expiry_date': getNearFutureExpiryDate(),
                    'gzip': true
                }),
                function() { 
                    callback();
                }
            );
        },
        function(callback) {
            deploy(
                mustache.to_html(s3_sync_cmd, {
                    'directory': tmp_dir + '/css',
                    's3bucket': s3bucket,
                    's3dir': '/' + version + '/',
                    'expiry_date': getFarFutureExpiryDate(),
                    'gzip': true
                }),
                function() { 
                    callback();
                }
            );
        }
        ],
        function() {
            callback();
        });
    
}

function deploy(command, callback) {
    child_pr.exec(
        command,
        function(error, stdout, stderr) {
            if (error !== null) {
                if (stdout) {
                    throw new Error("Error: " + error);
                }
            }
            if (stdout !== null) {
                process.stdout.write(stdout);
            }
            if (stderr !== null) {
                process.stderr.write(stderr);
                if (stderr.indexOf('s3cmd') > -1) {
                    process.stderr.write('ERROR: Have you installed and configured s3cmd?\n');
                    process.stderr.write('http://s3tools.org/s3cmd\n\n');
                }
            }
            callback();
        }
    );
}

function copyPasteupTo(dest) {
    fs.mkdirSync(dest, '0777');
    wrench.copyDirSyncRecursive('../static/css', dest + '/css');
    wrench.copyDirSyncRecursive('../static/js', dest + '/js');
    wrench.copyDirSyncRecursive('../.', dest + '/docs');
    // Don't copy the build directory to tmp.
    wrench.rmdirSyncRecursive(dest + '/docs/build', false);
    // Static files are already in top level dir.
    wrench.rmdirSyncRecursive(dest + '/docs/static', false);

}

function gzipFile(name, callback) {
    child_pr.exec('gzip ' + name, function() {
        child_pr.exec('mv ' + name + '.gz ' + name, function() {
            callback();
        });
    });
}

function gzipCssAndJs(callback) {
    async.parallel([
        function(callback) {
            fs.readdirSync(__dirname + '/' + tmp_dir + '/js').forEach(function(name) {
                gzipFile(__dirname + '/' + tmp_dir + '/js/' + name, function() {
                    callback();
                });
            });
        },
        function(callback) {
            fs.readdirSync(__dirname + '/' + tmp_dir + '/css').forEach(function(name) {
                gzipFile(__dirname + '/' + tmp_dir + '/css/' + name, function() {
                    callback();
                });
            });
        },
        function(callback) {
            fs.readdirSync(__dirname + '/' + tmp_v_dir + '/js').forEach(function(name) {
                gzipFile(__dirname + '/' + tmp_v_dir + '/js/' + name, function() {
                    callback();
                });
            });
        },
        function(callback) {
            fs.readdirSync(__dirname + '/' + tmp_v_dir + '/css').forEach(function(name) {
                gzipFile(__dirname + '/' + tmp_v_dir + '/css/' + name, function() {
                    callback();
                });
            });
        }
    ],
    // parallel callback;
    function(err, results) {
        callback();
    });
}
/*
Returns the most recent version number in /version
*/
function getVersionNumber() {
    var f = fs.readFileSync(__dirname  + '/../../version', 'utf8');
    var data = JSON.parse(f.toString());
    return data['versions'].pop();
}

function getFarFutureExpiryDate() {
    var d = new Date();
    d.setYear(d.getFullYear() + 10);
    return d.toGMTString();
}

function getNearFutureExpiryDate() {
    var d = new Date();
    d.setMinutes(d.getMinutes() + 1)
    return d.toGMTString();
}