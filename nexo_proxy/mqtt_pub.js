var mqtt = require('mqtt')
  , client = mqtt.createClient();

client.publish(process.argv[2], process.argv[3]);
client.end();