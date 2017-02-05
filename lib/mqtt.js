var eventbus = require('./eventbus');
var mqtt = require('mqtt');
var config = require('../etc/mqtt.json');

const T_SCHEDULE = config.prefix + 'schedule';
const T_SCHEDULE_SET = config.prefix + 'schedule/set';
const T_ZONE_SET = T_SCHEDULE + '/+/set';
const T_ZONE_TEMP_SET = T_SCHEDULE + '/+/temperature/set'

var client = mqtt.connect(config.url);

client.on('connect', function() { // When connected
    console.info('MQTT: Successfully connected');
    client.subscribe(T_SCHEDULE);
    client.subscribe(T_SCHEDULE_SET);
    client.subscribe(T_ZONE_SET);
    client.subscribe(T_ZONE_TEMP_SET);
});

client.on('close', function() {
   console.info('MQTT: Connection closed');
});

// when a message arrives, do something with it
client.on('message', function(topic, message, packet) {
  message = message.toString();
  console.log("MQTT: Recieved a message on "+topic+' topic');
  switch(topic) {
    case T_SCHEDULE:
      // Load last schedule, then unsubscribe
      client.unsubscribe(T_SCHEDULE);
    case T_SCHEDULE_SET:
      eventbus.emit('schedule.change', message);
      break;
    default:
      //TODO
      break;
  }
  
});

eventbus.on('schedule', msg => {
  client.publish(T_SCHEDULE, msg, {retain:true});
});