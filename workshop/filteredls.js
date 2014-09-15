var fs = require('fs'),
    path = require('path');

module.exports = function (directory, ext, callback) {

    fs.readdir(directory, function (err, list) {

        if (err) callback(err)
        else {
            for (file in list) if (path.extname(list[file]) == '.' + ext) {
                callback(null, list[file])
            }
        }
    })

}
