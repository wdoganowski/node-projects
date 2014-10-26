"use strict";

/*
 * Nexo Client
 */

var settings_file = './nexo_cred.json',
    settings = require(settings_file),
    fs = require('fs'),
    client_debug = require('debug')('client'),
    Nexo = require('nexo'),
    nexo = new Nexo(), 
    Fibaro = require('node-fibaro-api'),
    fibaro = new Fibaro(settings.fibaro.host, settings.fibaro.user, settings.fibaro.password),
    fibaro_debug = require('debug')('fibaro'),
    local_proxy = false,
    local_host = '';

nexo.setConfig(settings.nexo);

nexo.connectTo(function connected() {
  client_debug('CONNECTED TO: ' + nexo.host + ':' + nexo.port);

  nexo.on('close', reconnect);
  poolingLoop();
})

function poolingLoop() {
  nexo.poolFrom(function() {
    if (nexo.bufferLength()) {
      var buff = nexo.readBuffer(),
          id = settings.ids[buff];
      fibaro_debug(buff + ' Id ' + id);
      if (id) fibaro.call('callAction', {'deviceID': id, 'name': 'pressButton', 'arg1': 1}, function(err, data) {
        fibaro_debug('Call result ' + err + ' ' + data);
      });
    }
    setTimeout(poolingLoop, 10);
  });
}

function reconnect() {
  client_debug('END');
  nexo.connectTo(function connected() {
    client_debug('RENNECTED TO: ' + nexo.host + ':' + nexo.port);
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
  res.send({version: settings.version}); 
});

function checkState(relay, res) {
  nexo.checkState(relay, function() {
    var temp = nexo.readBuffer().replace(relay + ' jest ', '');
    switch (temp) {
      case 'wlaczone': 
        res.send({result: 'on'});
        break;
      case 'wylaczone':
        res.send({result: 'off'});
        break;
      default:
        res.send({error: 'unknown result'});
    }
  });  
}

router.get('/on').bind(function (req, res, params) { 
  if (params.relay) {
    nexo.switchOn(params.relay, function() {
      res.send({response:'OK'});//checkState(params.relay, res);
    });
  } else {
    res.send({error: 'relay required'}); 
  }
});

router.get('/off').bind(function (req, res, params) { 
  if (params.relay) {
    nexo.switchOff(params.relay, function() {
      res.send({response:'OK'});//checkState(params.relay, res);
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
    nexo.sendLogic(params.payload, function() {
      res.send({response:'OK'});/*nexo.poolFrom(function() {
        var temp = nexo.readBuffer();
        mqtt_client.publish(settings.mqtt.root + '/logic', temp);
        res.send({response: temp}); 
      });*/ 
    });
  } else {
    res.send({error: 'payload required'}); 
  }
});

router.get('/read').bind(function (req, res, params) { 
  nexo.poolFrom(function() {
    res.send(nexo.readBuffer()); 
  });
});

function isInt(n){
  return typeof n=="number" && isFinite(n) && n%1===0;
}

router.get('/add').bind(function (req, res, params) { 
  if (params.relay && params.deviceID) {
    var id = parseInt(params.deviceID);
    if (isInt(id)) {
      settings.ids[params.relay] = id;
      // Write out the settings file
      fs.writeFile(settings_file + '.tmp', JSON.stringify(settings, null, 2), function(err) {
          if(err) {
            proxy_debug('Error writing file ' + err);
          } else {
            fs.createReadStream(settings_file + '.tmp').pipe(fs.createWriteStream(settings_file));
          }
      }); 
      res.send({result: 'OK'}); 
    } else {
      res.send({error: 'deviceID must be int'}); 
    }
  } else {
    res.send({error: 'relay & deviceID required'}); 
  }
});

router.get('/update').bind(function (req, res, params) { 
  fibaro.call('virtualDevices', {}, function(err, data) {
    fibaro_debug('Devices (error ' + err + ')');
    if (err) {
      res.send({error: 'fibaro response error ' + err})
    } else {
      var host, port;
      if (local_proxy && local_host != '') {
        host = local_host;
        port = settings.proxy.port;
      } else {
        host = settings.proxy.host;
        port = settings.proxy.port;
      }
      settings.ids = {};
      data.forEach( function process_device(device) {
        if (device.enabled && device.properties.ip == host && device.properties.port == port) {    
          var id = device.id;
          device.properties.rows.forEach( function process_row(row) {
            row.elements.forEach( function process_element(element) {
              if (element.main) {
                fibaro_debug(element.name + ':' + id);
                settings.ids[element.name] = id;
              }
            });
          });      
        }
      });
      // Write out the settings file
      fs.writeFile(settings_file + '.tmp', JSON.stringify(settings, null, 2), function(err) {
          if(err) {
            proxy_debug('Error writing file ' + err);
          } else {
            fs.createReadStream(settings_file + '.tmp').pipe(fs.createWriteStream(settings_file));
          }
      }); 
      res.send({result: 'OK'}); 
    }
  });
});

/*
 * HTTP Proxy
 */

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  proxy_debug('local addr: '+add);
  local_host = add;
})
  
if ((settings.proxy.host == '127.0.0.1') || (settings.proxy.host == '::1') || (settings.proxy.host == 'localhost')) {
  require('http').createServer(function (request, response) {
    proxy_debug('Request ' + request.url);
    local_proxy = true;

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

  .listen(settings.proxy.port);
}
