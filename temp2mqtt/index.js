process.title = 'temp2mqtt';
var config = require('./etc/config.json');
var w1temp = require('w1temp');
var mqtt = require('mqtt');

w1temp.getSensor(config.deviceId).then( sensor => {
  var client = mqtt.connect(config.mqtt.url);
  client.on('connect', connack=>{
    console.log("Successfully connected to MQTT");
  });
  var lastTemp = false;
  console.log("Listening for temperature changes");
  sensor.on('change', temp => {
    temp = Math.round(temp*10)/10;
    if( lastTemp !== temp ) {
      lastTemp = temp;
      client.publish(config.mqtt.topic,temp.toString(), err => {
        if( err )
          console.error('Failed to publish temperature reading to MQTT: '+err);
      });
    }
  });
}, err => {
  console.error('Failed to get sensor: '+err);
});
