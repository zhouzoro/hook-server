var express = require('express');
var router = express.Router();
var cp = require('child_process');
var Promise = require('bluebird');
var shell = require('shelljs');
var winston = require('winston');
winston.add(winston.transports.File, {
    filename: __dirname + '/../public/hook-logs.log',
    handleExceptions: true,
    humanReadableUnhandledException: true
});
/** update app, takes webhook's payload as param
    return a restart func and a updateSource func **/
var updateApp = function(payload) {
    //get repo name and root path
    var repoName = payload.repository.name;
    var projPath = "/home/web/projects/running/" + repoName;
    shell.mkdir(projPath);

    //a restart func takes 3 steps: stop, npmInstall and start;
    var restart = function() {
        var stopApp = function() {
            winston.info('stopping' + repoName);
            return shell.exec('pm2 stop ' + projPath + '/' + repoName + '-master/bin/' + repoName);
        }
        var npmInstall = function() {
            //npm install only exec when package.json file modified;
            if (payload.commits[0].modified) {
                winston.info('checking npm install');
                for (var i = 0; i < payload.commits[0].modified.length; i++) {
                    if (payload.commits[0].modified[i] === 'package.json') {
                        winston.info('starting npm install');
                        shell.cd(projPath + '/' + repoName + '-master');
                        winston.info(shell.pwd());
                        return shell.exec('npm install --prefix /home/web/projects/running/' + repoName + '/' + repoName + '-master');

                    }
                };
                return 1;
            }
        }
        var startApp = function() {
            winston.info('exec extra init script');
            /** exec extra bash task if needed;
            cp.execFile(projPath + '/' + repoName + "-master/init.sh", function(err, stdout, stderr) {
                if (err) {
                    winston.error(err);
                }
                winston.info(stdout);
            });**/
            winston.info('starting' + repoName);
            return shell.exec('pm2 start ' + projPath + '/' + repoName + '-master/bin/' + repoName);
        }

        stopApp();
        Promise.resolve(npmInstall())
            .then(startApp());
    }
    /**
        updateSource: wget the source from master branch and unzip
    **/
    var updateSource = function() {

        var wget = function() {
            return shell.exec("wget -O /home/web//projects/running/" + repoName + "/master.zip 'https://github.com/zhouzoro/" + repoName + "/archive/master.zip'");
        }
        var unzip = function() {
            return shell.exec("unzip -o /home/web/projects/running/" + repoName + "/master.zip -d /home/web/projects/running/" + repoName);
        }

        Promise.resolve(wget())
            .then(unzip())
            .then(restart());
    }
    return {
        restart: restart,
        updateSource: updateSource
    }
}

router.post('/', function(req, res, next) {
    var committer = '';
    var branch = '';
    var repoName = '';
    try {
        committer = req.body.commits[0].committer.name;
        branch = req.body.ref.substring(11);
        repoName = req.body.repository.name;
    } catch (err) {
        winston.error(err);
    }
    winston.info(committer + '/' + repoName + '/' + branch + '/' + req.body.zyrestart);
    res.send(committer + '/' + repoName + '/' + branch + '/' + req.body.zyrestart);
    if (committer === 'zhouzoro'||committer === 'Jason Zhou' && branch === 'master') {
        var ua = updateApp(req.body);
        if (req.body.zyrestart) {
            ua.restart();
        } else {
            ua.updateSource();
        }
    }
});

router.post('/githook', function(req, res, next) {
    var committer = '';
    var branch = '';
    var repoName = '';
    try {
        committer = req.body.commits[0].committer.name;
        branch = req.body.ref.substring(11);
        repoName = req.body.repository.name;
    } catch (err) {
        winston.error(err);
    }
    winston.info(committer + '/' + repoName + '/' + branch + '/' + req.body.zyrestart);
    res.send(committer + '/' + repoName + '/' + branch + '/' + req.body.zyrestart);
    if (committer === 'zhouzoro' && branch === 'master') {
        var ua = updateApp(req.body);
        if (req.body.zyrestart) {
            ua.restart();
        } else {
            ua.updateSource();
        }
    }
});
router.get('/test',function(req,res){
    res.send('test ok')
})

router.post('/test',function(req,res){
    res.send('test ok')
})
module.exports = router;