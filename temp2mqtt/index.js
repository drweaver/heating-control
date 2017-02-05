process.title = 'temp2mqtt';
var config = require('./etc/config.json');
var w1temp = require('w1temp');
var mqtt = require('mqtt');

var client = mqtt.connect(config.mqtt.url);
client.on('connect', connack=>{
  console.log("Successfully connected to MQTT");
});

function publish(temp) {
  client.publish(config.mqtt.topic,temp.toString(), { retain: true }, err => {
  if( err )
    console.error('Failed to publish temperature reading to MQTT: '+err);
  });
}

w1temp.getSensor(config.deviceId).then( sensor => {
  var lastTemp = false;
  var log = [];
  var action = () => {
    var temp = sensor.getTemperature();
    log.unshift(temp);
    if( log.length > 30 ) log.pop();
    var av = 0;
    log.map( v => { av += v } );
    av = Math.round((av / log.length)*10)/10;
    if( lastTemp !== av ) {
      lastTemp = av;
      publish(av);
    }
    setTimeout( action, 1000 );
  };
  
  action();

}, err => {
  console.error('Failed to get sensor: '+err);
});

