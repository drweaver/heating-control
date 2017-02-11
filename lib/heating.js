var eventbus = require('./eventbus.js');
var logger = require('./logger')('heat');
var _ = require('underscore');

const thermostat_event = 'thermostat.event';
const schedule_event = 'schedule.event';

eventbus.on(thermostat_event, function(msg) {
    if( ! _.every(['state', 'zone', 'temperature_met'], v=>{ return _.has( msg,v )}  ) ) {
        logger.error('Thermostat event must have state, zone and temperature_met keys, ignoring');
        return;
    }
    if( msg.temperature_met ) {
        // temperature is met, override state to off
        msg.state = 'off';
    }
    heatingAction(msg);
});

eventbus.on(schedule_event, function(msg) {
    if( ! _.every(['state', 'zone'], v=>{ return _.has( msg,v ) } ) ) {
        logger.error('Schedule event must have state and zone keys, ignoring');
        return;
    }
    if( _.has(msg, ['temperature_sensor']) || _.has(msg, ['temperature_target']) ) {
        // requires a thermostat event, ignore
        return;
    }
    heatingAction(msg);
});

function heatingAction(msg) {
    logger.info('Zone '+msg.zone+' needs to be '+msg.state);
    eventbus.emit('heating.event', msg);
}