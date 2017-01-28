var awsIot = require('aws-iot-device-sdk');
var config = require('./etc/awsiot.json');

var thingShadows = awsIot.thingShadow({
   keyPath: __dirname + '/../etc/c9_garagedoor.private.key',
  certPath: __dirname + '/../etc/c9_garagedoor.cert.pem',
    caPath: __dirname + '/../etc/root-CA.crt',
  clientId: 'c9-garage-control',
    region: 'eu-west-1' 
});

// 
// Client token value returned from thingShadows.update() operation 
// 
var clientTokenUpdate;

var state = 'opening';

console.log('state is '+state);

thingShadows.on('connect', function() {
    console.log('Connected');
});

// thingShadows.register( 'c9_garagedoor', function() {
//     console.log('registration successful');
//   var garageDoorState = {"state":{"reported":{"state":state}}};

//   clientTokenUpdate = thingShadows.update('c9_garagedoor', garageDoorState  );
//   if (clientTokenUpdate === null)
//   {
//       console.log('update shadow failed, operation still in progress');
//   }
// });


function isUndefined(value) {
   return typeof value === 'undefined' || value === null;
}

thingShadows.register(config.thingName, {
    ignoreDeltas: false
 },
 function(err, failedTopics) {
    if (isUndefined(err) && isUndefined(failedTopics)) {
       console.log('Device thing registered.');
          var garageDoorState = {"state":{"reported":{"state":state}}};

clientTokenUpdate = thingShadows.update(config.thingName, garageDoorState  );
    }
 });

thingShadows.on('status', 
    function(thingName, stat, clientToken, stateObject) {
       console.log('received '+stat+' on '+thingName+': '+
                   JSON.stringify(stateObject));
// 
// These events report the status of update(), get(), and delete()  
// calls.  The clientToken value associated with the event will have 
// the same value which was returned in an earlier call to get(), 
// update(), or delete().  Use status events to keep track of the 
// status of shadow operations. 
// 
    });

thingShadows.on('delta', 
    function(thingName, stateObject) {
       console.log('received delta on '+thingName+': '+
                   JSON.stringify(stateObject));
    });
 
thingShadows.on('timeout',
    function(thingName, clientToken) {
       console.log('received timeout on '+thingName+
                   ' with token: '+ clientToken);
// 
// In the event that a shadow operation times out, you'll receive 
// one of these events.  The clientToken value associated with the 
// event will have the same value which was returned in an earlier 
// call to get(), update(), or delete(). 
// 
});

thingShadows.on('error', function(error) {
  console.log('error', error);
});

thingShadows.on('message', function(topic, payload) {
  console.log('message', topic, payload.toString());
});
