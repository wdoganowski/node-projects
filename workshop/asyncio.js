var fs = require('fs');

var file = fs.readFile(process.argv[2], 'utf8', read);

function read(err, buf) {
    if (!err) console.log(buf.split('\n').length-1);
}

