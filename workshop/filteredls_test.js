var filteredls = require('./filteredls');

filteredls(process.argv[2], process.argv[3], function(err, list) {
    if (!err) console.log(list);
})