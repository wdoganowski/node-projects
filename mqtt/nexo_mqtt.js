var settings = require('./nexo_mqtt_cred.json');

var net = require('net');
var nexo_client = new net.Socket();
var nexo_read = false; // When true, we need to read from Nexo after CMD OK

var mqtt = require('mqtt')
var mqtt_client = mqtt.createClient(settings.mqtt.port, settings.mqtt.host);

console.log('CONNECTING TO: ' + settings.nexo.host + ':' + settings.nexo.port);
nexo_client.connect(settings.nexo.port, settings.nexo.host, function() {

    console.log('CONNECTED TO: ' + settings.nexo.host + ':' + settings.nexo.port);
    // Write a message to the socket as soon as the nexo_client is connected, the server will receive it as message from the nexo_client 

});

// Convert hex to ASCII
function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var out = new Buffer(hex.length/2);
    for (var i = 0; i < hex.length; i += 2) {
        out.writeUInt8(parseInt(hex.substr(i, 2), 16),i/2);
    }
    return out;
}

// Sleep
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// MQTT to NEXO protocol converter
function mqtt2nexo(topic,message) {
    // /root/12345678/action/name value
    var nexo = '@' + settings.nexo.card_addr + ':';
    var topic_array = topic.split('/');

    //console.log(topic_array);

    nexo_read = false;
    if (topic_array[2] == 'resource') {
        nexo += 'system command ';
        if (message == 'on') nexo += 'system command wlacz '  + topic_array[3]
        else if (message == 'off') nexo += 'system command wylacz '  + topic_array[3]
        else if (message == 'state') {
            nexo += 'system C ' + topic_array[3] + ' ?';
            nexo_read = true;
        }
    } else if (topic_array[2] == 'ping') {
        nexo += 'ping';
    }
    nexo += '\0';


    return nexo;
}

// Add a 'close' event handler for the nexo_client socket
nexo_client.on('connect', function() {

    console.log('Connection opened');

    // Connext MQTT client and subscribe to all messages for the target card (root/card_addr/#)
    mqtt_client.subscribe(settings.mqtt.root + '/' + settings.nexo.card_addr + '/#');

});

// Add a 'data' event handler for the nexo_client socket
// data is what the server sent to this socket
nexo_client.on('data', function(data) {
    
    console.log('DATA: ' + data);
    
    if (data=='Welcome to AISIS server.') {
        nexo_client.write('plain\n\0');
    } else if (data == 'NO uSSL') {
        nexo_client.write(new Buffer(hex2a(settings.nexo.pass_md5 || require('crypto').createHash('md5').update(settings.nexo.password).digest('hex'))));
    } else if (data == 'LOGIN FAILED') {
        nexo_client.destroy();
    } else if (data == 'LOGIN OK') {
        nexo_client.write('!\0');
        nexo_client.write('@' + settings.nexo.card_addr + ':system info nexo_mqtt connected!\0');
    } else if (data == 'CMD OK') {
        if (nexo_read) {
            nexo_read = false;
            nexo_client.write('@' + settings.nexo.card_addr + ':get\0');
        }
    } else if (data.toString().substr(0,9)=='~' + settings.nexo.card_addr) {
        console.log(data.toString().substr(9, data.length - 9));
        mqtt_client.publish(settings.mqtt.root + '/' + settings.nexo.card_addr + '/' + data.toString().substr(10,data.length - 10))
    } else {
        console.log('?' + data[0]);
        //nexo_client.destroy();
    }

});

// Add a 'close' event handler for the nexo_client socket
nexo_client.on('close', function() {

    console.log('Connection closed');
    mqtt_client.end();

});

// Add a 'end' event handler for the nexo_client socket
nexo_client.on('end', function() {

    console.log('Connection ended');

});

// Add a 'timeout' event handler for the nexo_client socket
nexo_client.on('timeout', function() {

    console.log('Connection timed out');

});

// Add a 'drain' event handler for the nexo_client socket
nexo_client.on('drain', function() {

    console.log('Connection drained');

});

// Add a 'error' event handler for the nexo_client socket
nexo_client.on('error', function() {

    console.log('Connection error');

});

// 'message' handler for mqtt_clent
mqtt_client.on('message', function (topic, message) {

    console.log(mqtt2nexo(topic,message));
    nexo_client.write(mqtt2nexo(topic,message));

});
