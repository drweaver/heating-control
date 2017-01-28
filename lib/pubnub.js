var PubNub = require('pubnub');
var eventbus = require('./eventbus.js');
var config = require('../etc/pubnub.json');

const msgRoute = [
    { channel: "heatingcontrol.temperature.event", post: 'temperature.post', transform: noTransform },
    { channel: "heatingcontrol.schedule.request"   , post: 'schedule.request', transform: scheduleMerge    }
];

const temperatureRoute = msgRoute[0];
const scheduleRoute = msgRoute[1];

var pubnub = new PubNub({
    subscribeKey: config.subscribeKey,
    publishKey: config.publishKey,
    ssl: true,
    uuid: config.uuid || PubNub.generateUUID()
});

var activeSchedules = {};

eventbus.on('schedule.event', function(msg) {
    activeSchedules[msg.zone] = msg;
    publishActiveSchedules();
});

function publishActiveSchedules() {
    var schedules = Object.keys(activeSchedules).map(function(key) { return activeSchedules[key]; });
    pubnub.publish({
        channel   : 'heatingcontrol.schedule.event',
        message   : { schedules: schedules },
        callback  : function(e) { 
            console.log( "PUBNUB: Successfully published active schedules", e );
        },
        error     : function(e) { 
            console.log( "PUBNUB: Failed to publish active schedules!", e );
        }
    });
}

function noTransform(msg) {
    return msg;
}

function scheduleMerge(msg) {
    if( 'zone' in msg && msg.zone in activeSchedules ) {
        return Object.assign({}, activeSchedules[msg.zone], msg);
    } else {
        return msg;
    }
}

/* Emit temperature when message received */
pubnub.addListener({
    message: function(m) {
        var msg = m.message; // The Payload
        console.log("PUBNUB: New Message on channel "+m.channel);
        msgRoute.map(function(route) {
            if( route.channel == m.channel ) {
                eventbus.emit(route.post, route.transform(msg) );
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
        channel: 'heatingcontrol.schedule.event',
        reverse: false, 
        count: 10
    },
    function (status, response) {
        if( status.error ) {
            console.error( 'PUBNUB: Failed to retrieve schedule history' );
            return;
        }
        console.error( 'PUBNUB: Successfully retrieved schedule history' );
        var schedule;
        response.messages.map(function(msg) {
            msg.entry.schedules.map(s => {
                if( 'schedule' in s ) { schedule = s.schedule }
            });
        });
        eventbus.emit(scheduleRoute.post, { schedule_load: schedule });
    }
);

pubnub.subscribe({
    channels: msgRoute.map(function(r){return r.channel}),
    withPresence: false 
});