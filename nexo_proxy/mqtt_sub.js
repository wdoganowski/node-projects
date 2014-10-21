var mqtt = require('mqtt')
  , client = mqtt.createClient();

client.subscribe(process.argv[2]);
client.on('message', function(topic, message) {
  console.log(topic, message);
});