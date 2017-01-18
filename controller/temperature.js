var eventbus = require('./eventbus.js');

/**
 * This is the interface for all temperature sensors.
 * Sensors should publish events to 'temperature.post'
 * This module will handle messages and perform 
 * required operations to inject information into 
 * program operation 
 **/

const post_topic = 'temperature.post'; 

const temperature_event = 'temperature.event'; 
 
eventbus.on( post_topic, function(msg) {
    if( !objContainsKeys(msg, ['temperature_sensor', 'temperature']) ) {
        return;
    }
    console.log('TEMP: '+msg.temperature_sensor+' is currently '+msg.temperature);
    eventbus.emit(temperature_event, msg);
});

function objContainsKeys(obj, keys) {
    return keys.every(function(i) {
       return i in obj; 
    });
}