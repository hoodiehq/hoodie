var child_process = require('child_process'),
    rimraf = require('rimraf'),
    path = require('path');


exports.killCouch = function (data_dir, callback) {
    var cmd = 'pkill -f ' + data_dir;
    var pkill = child_process.exec(cmd, function (err, stdout, stderr) {
        // ignore errors from pkill
        callback();
    });
};

exports.resetFixture = function (dir, callback) {
    var data_dir = path.resolve(dir, 'data');
    rimraf(data_dir, function (err) {
        if (err) {
            return callback(err);
        }
        exports.killCouch(data_dir, callback);
    });
}
