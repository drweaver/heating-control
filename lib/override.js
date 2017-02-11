var eventbus = require('./eventbus.js');
var _ = require('underscore');
var logger = require('./logger')('ovrd');
var scheduleMap = {};

/** 
 * retain last schedule msg for each zone
 **/
eventbus.on('schedule.event', function(msg) {
    if( !_.has(msg, 'zone') ) {
        logger.error('schedule event missing zone key');
        return;
    }
    scheduleMap[msg.zone] = msg;
});

/**
 * Listen for override requests
 * 
 * Load new schedule:
 * { schedule: <schedule> }
 * 
 * Set a new temperature
 * { zone: <zone>, temperature_target: <number> }
 *
 * * Set a new temperature delta (increase)
 * { zone: <zone>, temperature_target_increase: <number> }
 * 
 * Set a different temperature sensor to base thermostat decision
 * { zone: <zone>, temperature_sensor: <sensor> }
 * 
 * Change the state to on/off
 * { zone: <zone>, state: <on|off> }
 * 
 * Override and hold for a set boost period
 * { zone: <zone>, boost: <minutes> }
 * 
 * 
 * Combine to e.g. boost heating for 1 hour by 2 degrees:
 * { zone: centralheating, state: on, temperature_target: +2, temperature_sensor: lounge, boost: 60 }
 *
 * 
 **/
eventbus.on('override.post', function(msg) {
    if( _.has(msg, 'schedule') ) {
        return eventbus.emit('schedule.change', msg);
    }
    if( _.has(msg, 'zone') ) {
        if( !_.has(scheduleMap, msg.zone)) {
            return logger.info('Ignoring, no existing zone named: '+msg.zone);
        }
        var override = Object.assign({}, scheduleMap[msg.zone], msg);
        if( _.has(override, 'temperature_target') ) {
            if( _.has(override, 'temperature_target_increase') ) {
                override.temperature_target += override.temperature_target_increase;
            } else if( _.has(override, 'temperature_target_decrease' ) ) {
                override.temperature_target -= override.temperature_target_decrease;
            }
        }
        override = _.omit(override, ['temperature_target_increase', 'temperature_target_decrease']);
        return eventbus.emit('schedule.request', override);
    }
});