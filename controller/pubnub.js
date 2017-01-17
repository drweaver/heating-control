var PubNub = require('pubnub');
var eventbus = require('./eventbus.js');
var config = require('../etc/pubnub.json');

const channel = 'heatingcontrol.temperature.event';
const pub_topic = 'pubnub.temperature.event';

var pubnub = new PubNub({
    subscribeKey: config.subscribeKey,
    publishKey: config.publishKey,
    ssl: true
});

/* Emit temperature when message received */
pubnub.addListener({
    message: function(m) {
        var msg = m.message; // The Payload
        console.log("New PubNub Message: ");
        console.dir(msg);
        eventbus.emit(pub_topic, msg );
    },
    status: function(s) {
        if (s.category === "PNConnectedCategory") {
                console.log("Successfully connected to PubNub");
        }
    }
});


/* Emit last temperature for each temperature sensor */
pubnub.history({
        channel: channel,
        reverse: false, 
        count: 100
    },
    function (status, response) {
        if( status.error ) {
            console.error( 'Failed to retrieve history from PubNub' );
            return;
        }
        var sensor_msg = {};
        response.messages.map(function(msg) {
           if( 'temperature_sensor' in msg.entry ) {
               sensor_msg[msg.entry.temperature_sensor] = msg.entry;
           }
        });
        for( var sensor in sensor_msg ) {
            eventbus.emit(pub_topic, sensor_msg[sensor]);
        }
    }
);

pubnub.subscribe({
    channels: [channel],
    withPresence: false 
});