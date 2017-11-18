process.title = 'temp2mqtt';
var config = require('./etc/config.json');
var w1temp = require('w1temp');
var mqtt = require('mqtt');
var _ = require('underscore');

_.each( ['TEMP_DEVICE_ID', 'TEMP_LOCATION', 'TEMP_MQTT_URL'], env=> {
  if( !_.has(process.env, env) ) {
    console.error('Missing environment variable: '+env+', exiting...');
    process.exit(1);
  }
});

var config = { 
  deviceId: process.env.TEMP_DEVICE_ID,
  mqtt: { 
    topic: 'home/'+process.env.TEMP_LOCATION+'/temperature',
    url: process.env.TEMP_MQTT_URL
  }
};		

var client = mqtt.connect(config.mqtt.url, { will: { topic: config.mqtt.topic+'/status', payload: 'Disconnected', retain: true, qos: 0 } });
client.on('connect', connack=>{
  console.log("Successfully connected to MQTT");
  client.publish(config.mqtt.topic+'/status', 'OK', { retain: true });
});

function publish(temp) {
  console.log('Publishing temperature '+temp+' degrees');
  client.publish(config.mqtt.topic,temp.toString(), { retain: false }, err => {
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

