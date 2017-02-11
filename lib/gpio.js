var eventbus = require('./eventbus.js');
var gpio = require('wpi-gpio');
var config = require('../etc/gpio.json');
var logger = require('./logger')('gpio');
var _ = require('underscore');


gpio.PHYS_GPIO = true;

validateConfig(config);
allOff(config);

eventbus.on('heating.event', function(msg) {
    if( ! _.every(['zone', 'state'], v=>{ return _.has(msg,v)}) ) {
        logger.error('Heating event missing zone or state key, ignoring');
        return;
    }   
    action(msg.zone, msg.state);
});

function validateConfig(config) {
    _.mapObject( config, (setting, zone)=>{
        _.each(['gpio', 'state_on', 'state_off'], v=>{
            if( !_.has(setting,v) )
                throw "gpio.json config is missing key "+v+" for zone: "+zone;
        });
    });
}

function allOff(config) {
    _.values( config, zone=>{
        action(zone, 'off');
    });
}

function action(zone, state) {
    
    if( !(zone in config) ) {
        logger.error('Heating event has no equivalent gpio configuration for zone: ' + zone);
        return;
    }
    
    var c = config[zone];
    var o = state == 'on' ? c.state_on : c.state_off;
    logger.info('For zone '+zone+' setting pin '+c.gpio+' to '+o);
    gpio.output(c.gpio, o).then(function() {
        logger.info('Operation successful');
    }, function(err) {
        logger.error('Operation failed: '+err);
    });
    
}

function cleanup() {
    gpio.SYNC = true;
    allOff(config);
    gpio.SYNC = false;
}

function exitHandler(options, err) {
    if (options.cleanup) cleanup();
    if (err) console.log(err);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
