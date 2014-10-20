"use strict";

/*
 * Test Server
 */

var server_debug = require('debug')('server'),
    i = 0, buffer = ['Welcome to AISIS server.'],
    server_socket = null;

function write_buffer() {
  if ((buffer.length > 0) && (server_socket != null)) {
    var payload = buffer.shift();
    server_debug('Server sending ' + payload); 
    server_socket.write(payload);
  }
  setTimeout(write_buffer, Math.random()*2000*1);  
}

require('net').createServer(function server(socket) {
    server_socket = socket;

    server_debug('New connection to the server from ' + 
        socket.remoteAddress + ':' + socket.remotePort + ' to ' + 
        socket.localAddress + ':' + socket.localPort);

    socket.on('data', function (data) {
        server_debug('Server Received <' + data.toString().substring(0,13) + '>');
        switch (data.toString().substring(0,13)) {
            case 'plain\n\0': 
                buffer.push('NO uSSL'); 
                break;
            case '1234': 
                buffer.push('LOGIN OK'); 
                break;
            case '!\0': 
                buffer.push('CMD OK');
                break; 
            case '@00000000:get': 
                buffer.push('~00000000:Answer from Nexo'); 
                break;
            case '@00000000:tes': 
                buffer.push('~00000000:Message response to ' + data.toString().substring(10)); 
                break;
            case '\0': 
                if (++i > 10) {
                    i = 0;
                    buffer.push('~00000000:A message from Nexo sent on pull'); 
                } else {
                    buffer.push('CMD OK'); 
                }
                break;
            default: 
              buffer.push('CMD OK');
              break;
        }
    });
})

.listen(1024);

write_buffer();

/*
 * Fake test client
 */
/*var fake_debug = require('debug')('fake'),
    counter1 = 0,
    fake1 = require('net').createConnection(8080, 'localhost', function fake_client1() {
      // on connected
      setTimeout(function fake_client_write1() {
        fake1.write('test (1) ' + ++counter1, function fake_client_written1() {
          fake_client1();
        })
      }, 500+Math.random()*1000);
    }),
    counter2 = 0,
    fake2 = require('net').createConnection(8080, 'localhost', function fake_client2() {
      // on connected
      setTimeout(function fake_client_write2() {
        fake2.write('test (2) ' + ++counter2, function fake_client_written2() {
          fake_client2();
        })
      }, 500+Math.random()*1000);
    });

*/
/*
 * Test Client
 */

var client_debug = require('debug')('client');
var settings_file = require('./nexo_cred.json').nexo; // This has to go out out of the moduke
var Nexo = require('./nexo'),
    nexo_client = new Nexo(); //to be replaced by new nexo.Socket above thsis module 

nexo_client.setConfig(settings_file);

nexo_client.connectTo(function connected() {
  client_debug('CONNECTED TO: ' + nexo_client.host + ':' + nexo_client.port);
  nexo_client.on('close', reconnect);
  poolingLoop();
})

function poolingLoop() {
  nexo_client.poolFrom(function() {
    if (nexo_client.bufferLength()) 
      client_debug('DATA: ' + nexo_client.readBuffer());
    setTimeout(poolingLoop, 10);
  });
}

function reconnect() {
  client_debug('END');
  nexo_client.connectTo(function connected() {
    client_debug('RENNECTED TO: ' + nexo_client.host + ':' + nexo_client.port);
  });
}

/*
 * Proxy server
 */

var proxy_debug = require('debug')('proxy'),
    router = new(require('journey').Router),
    util = require('util');

router.get('/version').bind(function (req, res) { 
  res.send({version: '1.0'}); 
});

router.get('/on').bind(function (req, res, params) { 
  if (params.relay) {
    nexo_client.switchOn(params.relay, function() {
      nexo_client.checkState(params.relay, function() {
        res.send({response: nexo_client.readBuffer()}); 
      }); 
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/off').bind(function (req, res, params) { 
  if (params.relay) {
    nexo_client.switchOff(params.relay, function() {
     nexo_client.checkState(params.relay, function() {
        res.send({response: nexo_client.readBuffer()}); 
      }); 
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/check').bind(function (req, res, params) { 
  if (params.relay) {
    nexo_client.checkState(params.relay, function() {
      res.send({response: nexo_client.readBuffer()}); 
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/logic').bind(function (req, res, params) { 
  if (params.payload) {
    nexo_client.writeTo(false, 'system logic ' + params.payload, function() {
     nexo_client.poolFrom(function() {
        res.send({response: nexo_client.readBuffer()}); 
      }); 
    });
  } else {
    res.send({error: 'payload required'}); 
  }
});

router.get('/read').bind(function (req, res, params) { 
  nexo_client.poolFrom(function() {
    res.send({response: nexo_client.readBuffer()}); 
  });
});

require('http').createServer(function (request, response) {
  proxy_debug('Request ' + request.url);
      
  var body = "";

  request.addListener('data', function (chunk) { body += chunk });
  request.addListener('end', function () {
      //
      // Dispatch the request to the router
      //
      router.handle(request, body, function (result) {
          response.writeHead(result.status, result.headers);
          response.end(result.body);
      });
  });
})

.listen(8080);

