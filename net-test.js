// Server

require('net').createServer(function (socket) {
    console.log('connected');

    socket.on('data', function (data) {
        console.log('Server Received ' + data.toString());
    });

    socket.write('Welcome to AISIS server.\n');
})

.listen(8080);

// Clinet

var socket = require('net').Socket();
function process_data() {
  // Welcome to AISIS server. -> plain
  // NO uSSL -> pass_md5
  // LOGIN FAILED -> _end_
  // LOGIN OK -> system info nexo-node connected!
}

socket.on('data', function (data) {
  console.log('Client Received ' + data.toString());
  buffer.push(data);
  process_data();
});

socket.connect(8080);

