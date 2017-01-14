/* global d3 eon PubNub angular */

var app = angular.module('HeatingControlApp');

app.controller('MainController', function($scope, $http, subscribeKey) {

  var __eon_pubnub = new PubNub({
    subscribeKey: subscribeKey
  });
  var channels = ["heatingcontrol.lounge.log","heatingcontrol.garage.log"];
  var __eon_labels = {"heatingcontrol.lounge.log":"Lounge","heatingcontrol.garage.log":"Garage"};
  
  var transform_temperature = function(message) {
    var o = {};
    if( message.channel && message.temp && message.time ) {
      if( channels.indexOf(message.channel) > -1 ) {
        o[__eon_labels[message.channel]] = message.temp;
        o['x'] = Math.floor(message.time/300000)*300000;
        return { eon: o };
      }
    }
    return null;
  };
  
  eon.chart({
    pubnub: __eon_pubnub,
    channels: channels,
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
      transition: { duration: 250 },
      tooltip: {show: true },
      point: {  show: true },
      axis: {
        y: { 
          tick: { format: d3.format('.2f') }
        },
        x: { tick: { format: d3.time.format("%H:%M") } }
      }
    },
    transform: transform_temperature,
    xType: 'custom',
    xId: 'x'
  });
  
  
  eon.chart({
    pubnub: __eon_pubnub,
    channels: ["heatingcontrol.lounge.log"],
    history: true,
    limit: 1,
    rate: 300000,
    generate: {
      bindto: '#lounge-gauge',
      data: { type: 'gauge' },
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
        threshold: { values: [18, 23] }
      }
    },
      transform: transform_temperature,
      xType: 'custom',
      xId: 'x'
  });
  
  
    eon.chart({
    pubnub: __eon_pubnub,
    channels: ["heatingcontrol.garage.log"],
    history: true,
    limit: 1,
    rate: 300000,
    generate: {
      bindto: '#garage-gauge',
      data: { type: 'gauge' },
      gauge: {
        min: -5,
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
        threshold: { values: [18, 23] }
      }
    },
      transform: transform_temperature,
      xType: 'custom',
      xId: 'x'
  });

});




