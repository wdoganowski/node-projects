var mqtt = require('mqtt')
  , client = mqtt.createClient();

client.subscribe('');
client.on('message', function(topic, message) {
  console.log(topic, message);
});