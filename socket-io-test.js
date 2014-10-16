var debug = require('debug')('net-test'),
    settings = require('./nexo_cred.json').nexo,
    net = require('net');

debug('Staring');

socket.on('connect', function () {
  debug('yay, connected!');
  socket.send('hi there!');
});

socket.on('message', function (msg) {
  debug('a new message came in: ' + JSON.stringify(msg));
});

socket.connect();