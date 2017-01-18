var eventbus = require('./eventbus.js');
var gpio = require('wpi-gpio');
var config = require('../etc/gpio.json');

gpio.PHYS_GPIO = true;

validateConfig(config);
allOff(config);

eventbus.on('heating.event', function(msg) {
    if( !objContainsKeys(msg, ['zone', 'state']) ) {
        console.error('GPIO: Heating event missing zone or state key, ignoring');
        return;
    }   
    action(msg.zone, msg.state);
});

function objContainsKeys(obj, keys) {
    return keys.every(function(i) {
       return i in obj; 
    });
}

function validateConfig(config) {
    for( var z in config ) {
        if( !objContainsKeys(config[z], ['gpio', 'state_on', 'state_off']))
            throw "gpio.json config requires values for gpio, state_on and state_off for zone: "+z;
    }
}

function allOff(config) {
    for( var z in config ) {
        action(z, 'off');
    }
}

function action(zone, state) {
    
    if( !(zone in config) ) {
        console.error('GPIO: Heating event has no equivalent gpio configuration for zone: ' + zone);
        return;
    }
    
    var c = config[zone];
    var o = state == 'on' ? c.state_on : c.state_off;
    console.log('GPIO: For zone '+zone+' setting pin '+c.gpio+' to '+o);
    gpio.output(c.gpio, o).then(function() {
        console.log('GPIO: Operation successful');
    }, function(err) {
        console.error('GPIO: Operation failed: '+err);
    });
    
}