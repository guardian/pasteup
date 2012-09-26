#!/usr/bin/env node

/* 
    Deploy pasteup files to S3.
    This script depends on s3cmd configured with appropriate Amazon S3 access credentials. */

var fs       = require('fs'),
    child_pr = require('child_process'),
    program  = require('commander'),
    mustache = require('mustache'),
    wrench   = require('wrench'),
    async    = require('async');

var tmp_dir   = 'deployable_artefact';

// envBuckets for dev-play account. TODO: Move these to PROD aws account.
var envBuckets = {
    'prod': 'pasteup',
    'qa': 'pasteup-qa-play',
    'code': 'pasteup-code-play'
}

// TODO: Move to serving these from real PROD buckets, on aws and aws-dev accounts.
// var envBuckets = {
//     'prod': 'pasteup-prod',
//     'qa': 'pasteup-qa',
//     'code': 'pasteup-code'
// }

var s3_sync_cmd = 's3cmd sync\
                     --recursive\
                     --acl-public\
                     --guess-mime-type\
                    {{#safe_cache}} --add-header "Cache-Control: max-age=60" {{/safe_cache}}\
                     --add-header "Expires: {{expiry_date}}"\
                      {{directory}} s3://{{bucket}}{{s3dir}}';

function doFullDeploy(bucket, callback) {
    deploy(
        mustache.to_html(s3_sync_cmd, {
            'directory': tmp_dir + '/',
            's3dir': '',
            'expiry_date': getFarFutureExpiryDate(),
            'safe_cache': false,
            'bucket': bucket
        }),
        function() {
            callback();
        }
    );
}

function doVersionDeploy(bucket, version, callback) {
    deploy(
        mustache.to_html(s3_sync_cmd, {
            'directory': tmp_dir + '/' + version + '/',
            's3dir': version,
            'expiry_date': getFarFutureExpiryDate(),
            'safe_cache': false,
            'bucket': bucket
        }),
        function() {
            process.exit();
        }
    );
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

/*
Returns the most recent version number in /version
*/
function getVersionNumber() {
    var f = fs.readFileSync(__dirname  + '/../versions', 'utf8');
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

if (!module.parent) {


    program
        .option('--ver <ver>', 'choose a specfic version directory to deploy');


    program
        .command('prod')
        .description('Deploy Pasteup to production.')
        .action(function() {
            program.confirm('Confirm deploy to PROD? ', function(ok) {
                console.log('Deploying to PROD');
                doFullDeploy(envBuckets['prod'], function() {
                    process.exit();
                });
            });

        });
    program
        .command('qa')
        .description('Deploy Pasteup to QA.')
        .action(function() {
            if (program.ver) {
                console.log("Version deployment is not currently supported.");
            }
            program.confirm('Confirm deploy to QA? ', function(ok) {
                if (ok) {
                    console.log('Deploying to QA');
                    doFullDeploy(envBuckets['qa'], function() {
                        process.exit();
                    });
                } else {
                    process.exit();
                }
            });
        });
    program
        .command('code')
        .description('Deploy Pasteup to CODE.')
        .action(function() {
            if (program.ver) {
                console.log("Version deployment is not currently supported.");
            }
            program.confirm('Confirm deploy to CODE? ', function(ok) {
                if (ok) {
                    console.log('Deploying to CODE');
                    doFullDeploy(envBuckets['code'], function() {
                        process.exit();
                    });
                } else {
                    process.exit();
                }
            });
        });

    program.parse(process.argv);

}