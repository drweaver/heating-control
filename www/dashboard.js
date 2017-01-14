/* global d3 eon PubNub angular */

var app = angular.module('HeatingControlApp');

app.controller('MainController', function($scope, $http, 'subscribeKey') {
  
var __eon_pubnub = new PubNub({
  subscribeKey: subscribeKey
});
var __eon_cols = ["temp"];
var __eon_labels = {"temp":"Lounge","garage":"Garage"};
eon.chart({
  pubnub: __eon_pubnub,
  channels: ["heatingcontrol.lounge.log"],
  history: true,
  flow: false,
  rate: 300000,
  limit: 288,
  generate: {
    bindto: "#chart",
    data: {
      colors: {"garage":"#113F8C","Lounge":"#E54028"},
      type: "spline"
    },
    transition: {
      duration: 250
    },
    tooltip: {
     show: true
    },
    point: {
      show: false
    },
    axis: {
      y: { 
        tick: { format: d3.format('.2f') },
        max: 30,
        min: 0,
        padding: { top: 0, bottom: 0 }
      },
      x: { tick: { format: d3.time.format("%H:%M") } }
    }
  },
  transform: transform_temperature
});


eon.chart({
  pubnub: __eon_pubnub,
  channels: ["heatingcontrol.lounge.log"],
  history: true,
  limit: 1,
  rate: 300000,
  generate: {
    bindto: '#lounge-gauge',
    data: {
      type: 'gauge'
    },
    gauge: {
      min: 5,
      max: 30,
      units: ' C',
      label: {
            format: function(value, ratio) {
                return value + ' \xB0C';
            },
            show: false // to turn off the min/max labels.
      },
    },
    color: {
      pattern: ['#779ECB', '#FFB347', '#FF6961'],
      threshold: {
        values: [18, 23]
      }
    }
  },
    transform: transform_temperature
});
  
});





var transform_temperature = function(message) {
    console.log(message);
    var o = {};
    var found = false;
    for(var index in message) {
      if(__eon_cols.indexOf(index) > -1){
        o[__eon_labels[index] || index] = message[index];
        found = true;
      }
    }
    if( !found ) return null;
    return {
      eon: o
    };
};