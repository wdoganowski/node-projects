"use strict";

var o = { one: 1, 'two-2': 2, three: 3 };
/*o['one'] = 1;
o['two'] = 2;
o['three'] = 3;*/
o['four'] = 4;
console.log( o['four'] ); // Alerts "First"
console.log( JSON.stringify(o, null, 2) );

/*var fs = require('fs');
fs.writeFile("./test", JSON.stringify(o, null, 2), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); */
