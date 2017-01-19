var PubNub = require('pubnub');
var eventbus = require('./eventbus.js');
var config = require('../etc/pubnub.json');

const msgRoute = [
    { channel: "heatingcontrol.temperature.event", post: 'temperature.post' },
    { channel: "heatingcontrol.override.event"   , post: 'override.post'    }
];

const temperatureRoute = msgRoute[0];
const scheduleRoute = msgRoute[1];

var pubnub = new PubNub({
    subscribeKey: config.subscribeKey,
    publishKey: config.publishKey,
    ssl: true
});

/* Emit temperature when message received */
pubnub.addListener({
    message: function(m) {
        var msg = m.message; // The Payload
        console.log("PUBNUB: New Message on channel "+m.channel);
        //console.dir(msg);
        msgRoute.map(function(route) {
            if( route.channel == m.channel ) {
                eventbus.emit(route.post, msg );
            }
        });
    },
    status: function(s) {
        if (s.category === "PNConnectedCategory") {
                console.log("PUBNUB: Successfully connected");
        }
    }
});

/**
 * status categories:
 * 
 * PNNetworkUpCategory     SDK detected that network is online.
 * PNNetworkDownCategory   SDK detected that network is down.
 * PNNetworkIssuesCategory A subscribe event experienced an exception when running.
 * PNReconnectedCategory   SDK was able to reconnect to pubnub.
 * PNConnectedCategory     SDK subscribed with a new mix of channels (fired every time the channel / channel group mix changed).SDK
**/


/**
 * Emit last temperature for each temperature sensor 
 **/
pubnub.history({
        channel: temperatureRoute.channel,
        reverse: false, 
        count: 100
    },
    function (status, response) {
        if( status.error ) {
            console.error( 'PUBNUB: Failed to retrieve temperature history' );
            return;
        }
        var sensor_msg = {};
        response.messages.map(function(msg) {
           if( 'temperature_sensor' in msg.entry ) {
               sensor_msg[msg.entry.temperature_sensor] = msg.entry;
           }
        });
        for( var sensor in sensor_msg ) {
            eventbus.emit(temperatureRoute.post, sensor_msg[sensor]);
        }
    }
);

/**
 * Emit last schedule
 */
pubnub.history({
        channel: scheduleRoute.channel,
        reverse: false, 
        count: 1
    },
    function (status, response) {
        if( status.error ) {
            console.error( 'PUBNUB: Failed to retrieve schedule history' );
            return;
        }
        console.error( 'PUBNUB: Successfully retrieved schedule history' );
        response.messages.map(function(msg) {
            eventbus.emit(scheduleRoute.post, msg.entry);
        });
    }
);

pubnub.subscribe({
    channels: msgRoute.map(function(r){return r.channel}),
    withPresence: false 
});