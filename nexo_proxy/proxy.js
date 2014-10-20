"use strict";

/*
 * Mosca MQTT broker
 */

var settings_file = require('./nexo_cred.json'),
    mqtt = require('mqtt'),
    mqtt_debug = require('debug')('mqtt'),
    util = require('util');

if ((settings_file.mqtt.host == '127.0.0.1') || (settings_file.mqtt.host == '::1') || (settings_file.mqtt.host == 'localhost')) {
  mqtt_debug('starting');

  mqtt.createServer(function(client) {
    mqtt_debug('started');

    var self = this;

    if (!self.clients) self.clients = {};

    client.on('connect', function(packet) {
      client.connack({returnCode: 0});
      client.id = packet.clientId;
      mqtt_debug("CONNECT(%s): %j", client.id, packet);
      self.clients[client.id] = client;
    });

    client.on('publish', function(packet) {
      mqtt_debug("PUBLISH(%s): %j", client.id, packet);
      for (var k in self.clients) {
        self.clients[k].publish({topic: packet.topic, payload: packet.payload});
      }
    });

    client.on('subscribe', function(packet) {
      mqtt_debug("SUBSCRIBE(%s): %j", client.id, packet);
      var granted = [];
      for (var i = 0; i < packet.subscriptions.length; i++) {
        granted.push(packet.subscriptions[i].qos);
      }

      client.suback({granted: granted, messageId: packet.messageId});
    });

    client.on('pingreq', function(packet) {
      mqtt_debug('PINGREQ(%s)', client.id);
      client.pingresp();
    });

    client.on('disconnect', function(packet) {
      client.stream.end();
    });

    client.on('close', function(err) {
      delete self.clients[client.id];
    });

    client.on('error', function(err) {
      mqtt_debug('error!', err);

      if (!self.clients[client.id]) return;

      client.stream.end();
      mqtt_debug(err);
    });
  })

  .listen(settings_file.mqtt.port);
}

/*
 * Nexo Client
 */

var client_debug = require('debug')('client'),
    Nexo = require('nexo'),
    nexo_client = new Nexo(), //to be replaced by new nexo.Socket above thsis module 
    mqtt_client = mqtt.createClient(settings_file.mqtt.port, settings_file.mqtt.host);
  
nexo_client.setConfig(settings_file.nexo);

nexo_client.connectTo(function connected() {
  client_debug('CONNECTED TO: ' + nexo_client.host + ':' + nexo_client.port);
  mqtt_client.publish(settings_file.mqtt.root + '/debug', 'nexo proxy connected to ' + nexo_client.host + ':' + nexo_client.port);

  mqtt_client.on('message', function (topic, message) {
    client_debug(message);
  });

  nexo_client.on('close', reconnect);
  poolingLoop();
})

function poolingLoop() {
  nexo_client.poolFrom(function() {
    if (nexo_client.bufferLength()) {
      mqtt_client.publish(settings_file.mqtt.root + '/logic', nexo_client.readBuffer());
    }
    setTimeout(poolingLoop, 10);
  });
}

function reconnect() {
  client_debug('END');
  nexo_client.connectTo(function connected() {
    client_debug('RENNECTED TO: ' + nexo_client.host + ':' + nexo_client.port);
    mqtt_client.publish(settings_file.mqtt.root + '/debug', 'nexo proxy re-connected to ' + nexo_client.host + ':' + nexo_client.port);
    poolingLoop();
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

function checkState(relay, res) {
  nexo_client.checkState(relay, function() {
    var temp = nexo_client.readBuffer().replace(relay + ' jest ', '');
    switch (temp) {
      case 'wlaczone': 
        temp = 'on';
        break;
      case 'wylaczone':
        temp = 'off';
        break;
    }
    mqtt_client.publish(settings_file.mqtt.root + '/switch/' + relay, temp);
    res.send({response: temp});
  });  
}

router.get('/on').bind(function (req, res, params) { 
  if (params.relay) {
    nexo_client.switchOn(params.relay, function() {
      checkState(params.relay, res);
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/off').bind(function (req, res, params) { 
  if (params.relay) {
    nexo_client.switchOff(params.relay, function() {
      checkState(params.relay, res);
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/check').bind(function (req, res, params) { 
  if (params.relay) {
    checkState(params.relay, res);
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/logic').bind(function (req, res, params) { 
  if (params.payload) {
    nexo_client.writeTo(false, 'system logic ' + params.payload, function() {
      nexo_client.poolFrom(function() {
        var temp = nexo_client.readBuffer();
        mqtt_client.publish(settings_file.mqtt.root + '/logic', temp);
        res.send({response: temp}); 
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

if ((settings_file.proxy.host == '127.0.0.1') || (settings_file.proxy.host == '::1') || (settings_file.proxy.host == 'localhost')) {
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

  .listen(settings_file.proxy.port);
}
