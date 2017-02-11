var eventbus = require('./eventbus.js');
var logger = require('./logger')('temp');
var _ = require('underscore');

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
    if( ! _.every(['temperature_sensor', 'temperature'], v=>{ return _.has(msg,v )} ) ) {
        return;
    }
    logger.info(msg.temperature_sensor+' is currently '+msg.temperature);
    eventbus.emit(temperature_event, msg);
});