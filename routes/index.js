var express = require('express');
var router = express.Router();
var cp = require('child_process');
var Promise = require('bluebird');
var fs = require('fs-extra');
var shell = require('shelljs');
var winston = require('winston');
winston.add(winston.transports.File, {
    filename: __dirname + '/../public/hook-logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});
var updateApp = function(repo) {
    var projPath = "/home/web/projects/running/" + repo;
    shell.mkdir(projPath);
    var restart = function() {
        var stopApp = function() {
            winston.info('stopping' + repo);
            return shell.exec('pm2 stop ' + projPath + '/bin/' + repo);
        }
        var npmInstall = function() {
            winston.info('npm installing node_modules');
            var cmd = shell.exec('npm install --prefix /home/web/projects/running/' + repo, {
                async: true
            });
            return new Promise(fulfill, reject) {
                cmd.stdout.on('data', function(data) {
                    console.log('stdout::' + data);
                })
                cmd.code.on('data', function(data) {
                    console.log('exit-code::' + data);
                    fulfill(data);
                })
            }
        }
        var startApp = function() {
            winston.info('exec extra init script');
            cp.execFile(projPath + '/' + repo + "-master/init.sh", function(err, stdout, stderr) {
                if (err) {
                    winston.error(err);
                }
                winston.info(stdout);
            });
            winston.info('starting' + repo);
            return shell.exec('pm2 start ' + projPath + '/bin/' + repo);
        }

        stopApp();
        Promise.resolve(shell.exec('cd ' + projPath))
            .then(npmInstall())
            .then(startApp());

        /*var cdPath = function() {
                var cd = shell.exec('cd ' + projPath);
                return new Promise(fulfill, reject) {
                    cd.stdout.on('data', function(data) {

                    })
                }
            }
        cp.execFile(projPath + "/restart.sh", function(err, stdout, stderr) {
            if (err) {
                winston.error(err);
            }
            winston.info(stdout);
        });*/
    }
    var updateSource = function() {

        var wget = function() {
            winston.info('downloading');
            var cmd = shell.exec("wget -O /home/web//projects/running/" + repo + "/master.zip 'https://github.com/zhouzoro/" + repo + "/archive/master.zip'", {
                async: true
            });
            return new Promise(fulfill, reject) {
                cmd.stdout.on('data', function(data) {
                    console.log('stdout::' + data);
                })
                cmd.code.on('data', function(data) {
                    console.log('exit-code::' + data);
                    fulfill(data);
                })
            }
        }
        var unzip = function() {
            winston.info('unzipping');
            var cmd = shell.exec("unzip -o /home/web/projects/running/" + repo + "/master.zip -d /home/web/projects/running/" + repo, {
                async: true
            });
            return new Promise(fulfill, reject) {
                cmd.stdout.on('data', function(data) {
                    console.log('stdout::' + data);
                })
                cmd.code.on('data', function(data) {
                    console.log('exit-code::' + data);
                    fulfill(data);
                })
            }
        }
        wget().then(unzip()).then(restart())
            /*cp.execFile(projPath + "/wget.sh", function(err, stdout, stderr) {
                if (err) {
                    winston.error(err);
                }
                cp.execFile(projPath + "/unzip.sh", function(err, stdout, stderr) {
                    if (err) {
                        winston.error(err);
                    }
                    cp.execFile(projPath + "/restart.sh", function(err, stdout, stderr) {
                        if (err) {
                            winston.error(err);
                        }
                        restart();
                    });
                    // Done.
                    winston.info(stdout);
                });
                // Done.
                winston.info(stdout);
            });*/
    }
    return {
        restart: restart,
        updateSource: updateSource
    }
}

router.post('/', function(req, res, next) {
    var committer = '';
    var branch = '';
    var repo = '';
    try {
        committer = req.body.commits.committer.name;
        branch = req.body.ref.substring(11);
        repo = req.body.repository.name;
    } catch (err) {
        winston.error(err);
    }
    if (committer === 'zhouzoro' && branch === 'master') {
        var ua = updateApp(repo);
        if (req.body.zyrestart = true) {
            ua.restart();
        } else {
            ua.updateSource();
        }
    }
    winston.info(repo + '/' + branch)
    res.send(repo + '/' + branch);
});
module.exports = router;
