var eventbus = require('./eventbus');
var mqtt = require('mqtt');
var config = require('../etc/mqtt.json');
var _ = require('underscore');
const logger = require('./logger')('mqtt');

const T_SCHEDULE = 'home/heating/schedule';
const T_SCHEDULE_SET = 'home/heating/schedule/set';
const T_ZONE_SET = T_SCHEDULE + '/+/set';
const T_ZONE_TEMP_SET = T_SCHEDULE + '/+/temperature/set';
const T_ZONE_TEMP_INC = T_SCHEDULE + '/+/temperature/increase';
const T_ZONE_TEMP_DEC = T_SCHEDULE + '/+/temperature/decrease';

const T_TEMP_SENSOR = 'home/+/temperature';

var offlineTimer = null;
var sensors = [];

var client = mqtt.connect(config.url);

client.subscribe(T_SCHEDULE);
client.subscribe(T_SCHEDULE_SET);
client.subscribe(T_ZONE_SET);
client.subscribe(T_ZONE_TEMP_SET);
client.subscribe(T_ZONE_TEMP_INC);
client.subscribe(T_ZONE_TEMP_DEC);
client.subscribe(T_TEMP_SENSOR);

client.on('connect', function() { // When connected
    logger.info('Connection online');
    handleOffline();
});

client.on('offline', function() {
   logger.warn('Connection offline');
   handleOffline();
});

// when a message arrives, do something with it
client.on('message', function(topic, message, packet) {
  message = message.toString();
  logger.info("Recieved a message on "+topic+' topic');
  switch(topic) {
    case T_SCHEDULE:
      // Load last schedule, then unsubscribe
      client.unsubscribe(T_SCHEDULE);
    case T_SCHEDULE_SET:
      eventbus.emit('override.post', { schedule: message });
      break;
    default:

      var match, zone, temp;
      if( (match = topic.match(/home\/heating\/schedule\/(\w+?)\/set/)) != null ) {
        zone = match[1];
        logger.info("zone "+zone+" requested to be "+message);
        if( message == 'on' || message == 'off' ) {
          eventbus.emit('override.post', { zone: zone, state: message });
        } else {
          logger.info("Ignored, should be on or off");
        }
      } else if( (match = topic.match(/home\/heating\/schedule\/(\w+?)\/temperature\/(set|increase|decrease)/)) != null ) {
        zone = match[1];
        var action = match[2];
        logger.info("zone "+zone+" requested temperature to be "+message);
        temp = parseFloat(message);
        if( !isNaN( temp ) ) {
          if( action == 'set' ) {
            eventbus.emit('override.post', {zone: zone, temperature_target: temp} );
          } else if ( action == 'increase' ) {
            eventbus.emit('override.post', {zone: zone, temperature_target_increase: temp} );
          } else if ( action == 'decrease' ) {
            eventbus.emit('override.post', {zone: zone, temperature_target_decrease: temp} );
          }
        } else {
          logger.info('Ignoring, not a valid float');
        }
      } else if( (match = topic.match(/home\/(\w+?)\/temperature/)) != null ) {
        var sensor = match[1];
        logger.info("temperature sensor " + sensor + " reported " + message);
        temp = parseFloat(message);
        eventbus.emit('temperature.post', {temperature_sensor: sensor, temperature: isNaN(temp) ? null : temp });
        if( !_.contains(sensors, sensor) ) {
          sensors.push(sensor);
        }
      }
      break;
  }
  
});

eventbus.on('schedule', msg => {
  client.publish(T_SCHEDULE, msg.schedule, {retain:true});
});

eventbus.on('schedule.event', msg => {
  if( _.every(['zone', 'state'], v=>{ return _.has(msg,v) } ) ) {
    client.publish(T_SCHEDULE+'/'+msg.zone, msg.state, {retain:true});
    if( _.has(msg, 'temperature_target') ) {
      client.publish(T_SCHEDULE+'/'+msg.zone+'/temperature', msg.temperature_target.toString(), {retain:true});
    }
  }
});

function handleOffline() {
  if( client.connected ) {
    if( offlineTimer != null ) {
      clearTimeout( offlineTimer );
      offlineTimer = null;
    }
  } else {
    if( offlineTimer != null ) 
      return;
    offlineTimer = setTimeout(()=> {
      logger.warn('Offline for too long, sending null temperature values');
      _.each(sensors, s=>{ eventbus.emit('temperature.post',{temperature_sensor:s,temperature:null})});
    }, 300000);
  }
}