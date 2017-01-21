var eventbus = require('./eventbus.js');

var scheduleMap = {};

/** 
 * retain last schedule msg for each zone
 **/
eventbus.on('schedule.event', function(msg) {
    if( !objContainsKeys(msg, ['zone']) ) {
        console.error('OVERRIDE: schedule event missing zone key');
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
 * Set a new temperature (use +/- to alter existing)
 * { zone: <zone>, temperature_target: <[+-]number> }
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
    if( 'schedule' in msg ) {
        eventbus.emit('schedule.post', msg);
        return;
    }
});

function objContainsKeys(obj, keys) {
    return keys.every(function(i) {
       return i in obj; 
    });
}