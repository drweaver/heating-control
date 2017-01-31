var config = require('./etc/config.json');
var w1temp = require('w1temp');
var mqtt = require('mqtt');

w1temp.getSensor(config.deviceId).then( sensor => {
  var client = mqtt.connect(config.mqtt.url);
  var lastTemp = false;
  sensor.on('change', temp => {
    temp = Math.round(temp*10)/10;
    if( lastTemp !== temp ) {
      lastTemp = temp;
      console.log('Temp changed: '+temp);
      client.publish(config.mqtt.topic,temp.toString());
    }
  });
});
