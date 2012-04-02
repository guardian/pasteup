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
    tmp_dir   = 'deploy_tmp',
    tmp_v_dir = tmp_dir + '/' + getVersionNumber();

var s3_sync_cmd = 's3cmd sync\
                     --recursive\
                     --acl-public\
                     --guess-mime-type\
                     --add-header "Content-Encoding: gzip"\
                     --add-header "Expires: Thu, 15 Apr 2022 20:00:00 GMT"\
                      {{directory}}/ s3://{{s3bucket}}/';

/* Check the build number we're about to deploy */
process.stdout.write('\nYou are deploying version: ' + getVersionNumber());
process.stdout.write('\nIs this the correct version number? (y/n)');
var stdin = process.openStdin();
stdin.setEncoding('utf8');
stdin.once('data', function(val) {
    if (val.trim() === 'y') {
        doDeploy();
    } else {
        process.stdout.write("\nUpdate the version number in /version\n\n");
    }
}).resume();

function doDeploy() {
    copyPasteupTo(tmp_dir);
    copyPasteupTo(tmp_v_dir);

    gzipCssAndJs(function() {
        // After files are gzipped...
        child_pr.exec(
            // Send tmp_dir to s3.
            mustache.to_html(s3_sync_cmd, {'directory': tmp_dir, 's3bucket': s3bucket}),
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
                }
                // Remove the tmp dir. TODO: Deal with output?
                child_pr.exec('rm -rf ' + tmp_dir, function() {});
                process.exit();
            }
        );
    });
}

function copyPasteupTo(dest) {
    fs.mkdirSync(dest, '0777');
    wrench.copyDirSyncRecursive('../css', dest + '/css');
    wrench.copyDirSyncRecursive('../js', dest + '/js');
    wrench.copyDirSyncRecursive('../content', dest + '/content');
    wrench.copyDirSyncRecursive('../docs', dest + '/docs');
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
    var f = fs.readFileSync(__dirname  + '/../version', 'utf-8');
    var data = JSON.parse(f.toString());
    return data['versions'].pop();
}