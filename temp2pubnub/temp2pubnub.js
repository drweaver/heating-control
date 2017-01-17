#!/usr/bin/env node

// temp2pubnub --subkey abc-123 --pubkey xyz-789 --channel my.channel.name <temperature>

var argv = require('yargs')
    .usage('Usage: $0 --subkey [key] --pubkey [key] --channel [channel] --name [sensorname] <temperature>')
    .alias('s','subkey')
    .alias('p','pubkey')
    .alias('c','channel')
    .alias('n','name')
    .demandCommand(1)
    .demandOption(['s','p','c','n'])
    .check(function(argv) {
      if( isNaN(parseFloat(argv._[0])) ) throw "Not a valid number: " + argv._[0];
      return true;
    })
    .argv;

var temp = parseFloat(argv._[0]);

var PubNub = require('pubnub');

var pubnub = new PubNub({
        publishKey : argv.p,
        subscribeKey: argv.s
});

function publish(msg) {
        console.log("Publishing message to PubNub");
        var publishConfig = {
            channel : argv.c,
            message : msg
        };
        pubnub.publish(publishConfig, function(status, response) {
            console.log(status, response);
        });
}

publish({'temperature': temp, 'temperature_sensor': argv.n, 'time': new Date().getTime()});
