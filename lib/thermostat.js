var eventbus = require('./eventbus.js');

const temperature_event = 'temperature.event';
const schedule_event = 'schedule.event';

var currentSchedule = {}; // keyed on zone
var currentTemperature = {}; // keyed on temperature_sensor

eventbus.on(temperature_event, function(msg) {
    if( !msgAssert(msg, ['temperature_sensor', 'temperature'] ) ) {
        return;
    }
    currentTemperature[msg.temperature_sensor] = msg;
    for( var zone in currentSchedule ) {
        if( currentSchedule[zone].temperature_sensor == msg.temperature_sensor ) {
            thermostatAction(zone, msg.temperature_sensor);
        }
    }
});

eventbus.on(schedule_event, function(msg) {
    if( !msgAssert(msg, ['temperature_sensor', 'zone', 'temperature_target'] ) ) {
        console.log('THERMOSTAT: Ignoring schedule event that has no thermostat requirement: '+msg.zone);
        return;
    }
    currentSchedule[msg.zone] = msg;
    thermostatAction(msg.zone, msg.temperature_sensor);
});

function thermostatAction(zone, temperature_sensor) {
    var temperatureMet = !(temperature_sensor in currentTemperature) || currentTemperature[temperature_sensor].temperature == null || currentTemperature[temperature_sensor].temperature >= currentSchedule[zone].temperature_target;
    var publish = Object.assign({temperature_met: temperatureMet}, currentSchedule[zone]);
    console.log('THERMOSTAT: Temperature for '+zone+' is'+(temperatureMet?' ':' not ')+'met (target is '+currentSchedule[zone].temperature_target+')');
    eventbus.emit('thermostat.event', publish);
}

function msgAssert(msg, assert) {
    return assert.every(function(i) {
       return i in msg; 
    });
}