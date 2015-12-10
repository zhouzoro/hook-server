var express = require('express');
var router = express.Router();
var cp = require('child_process');

var winston = require('winston');
winston.add(winston.transports.File, {
    filename: './public/hook-logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});
var updateApp = function(repo) {
    var projPath = "C:/Projects/GitHub/running." + repo;
    cp.exec(projPath + "/wget.bat", function(err, stdout, stderr) {
        if (err) {
            winston.error(err);
        }
        cp.exec(projPath + "/unzip.bat", function(err, stdout, stderr) {
            if (err) {
                winston.error(err);
            }
            cp.exec(projPath + "/npm-install.bat", function(err, stdout, stderr) {
                if (err) {
                    winston.error(err);
                }
                cp.execFile(projPath + "/nodemon.bat", function(err, stdout, stderr) {
                    if (err) {
                        winston.error(err);
                    }
                    // Done.
                    winston.info(stdout);
                });
                // Done.
                winston.info(stdout);
            });
            // Done.
            winston.info(stdout);
        });
        // Done.
        winston.info(stdout);
    });
}

router.post('/', function(req, res, next) {
    var branch = '';
    var repo = '';
    try {
        branch = req.body.ref.substring(11);
        repo = req.body.repository.name;
    } catch (err) {
        winston.error(err);
    }
    if (branch === 'master') {
        updateApp(repo);
    }
    winston.info(repo + '/' + branch)
    res.send(repo + '/' + branch);
});
module.exports = router;
