var mqtt = require('mqtt')

// Sleep
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

client = mqtt.createClient(1883, 'localhost');

client.subscribe('#');

//client.publish('dogan/00000000/resource/\'przek salon\'', 'on' );
client.publish('dogan/00000000/ping');
//client.publish('dogan/00000000/resource/\'przek salon\'', 'off' );
//client.publish('dogan/00000000/resource/\'przek salon\'', 'state' );
//client.publish('dogan/00000000/door', 'otworz' );
//client.publish('dogan/00000000/alarm/partytion1', 'arm' );
//client.publish('dogan/00000000/command', 'test' );


client.on('message', function (topic, message) {
    console.log('MQTT: ' + topic + ' - ' + message);
});

sleep(1000);

client.end();