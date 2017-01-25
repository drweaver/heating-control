var eventbus = require('./eventbus.js');

const thermostat_event = 'thermostat.event';
const schedule_event = 'schedule.event';

eventbus.on(thermostat_event, function(msg) {
    if( !msgAssert( msg, ['state', 'zone', 'temperature_met'] ) ) {
        console.error('Thermostat event must have state, zone and temperature_met keys, ignoring');
        return;
    }
    if( msg.temperature_met ) {
        // temperature is met, override state to off
        msg.state = 'off';
    }
    heatingAction(msg);
});

eventbus.on(schedule_event, function(msg) {
    if( !msgAssert( msg, ['state', 'zone'] ) ) {
        console.error('Schedule event must have state and zone keys, ignoring');
        return;
    }
    if( msgAssert(msg, ['temperature_sensor']) || msgAssert(msg, ['temperature_target']) ) {
        // requires a thermostat event, ignore
        return;
    }
    heatingAction(msg);
});

function heatingAction(msg) {
    console.log('HEATING: Zone '+msg.zone+' needs to be '+msg.state);
    eventbus.emit('heating.event', msg);
}

function msgAssert(msg, assert) {
    return assert.every(function(i) {
       return i in msg; 
    });
}