var jsonfile = require('jsonfile');
var cron = require('node-cron');
var eventbus = require('./eventbus.js');
var later = require('later');

var schedulefilename = "../etc/schedule.json";
var activeSchedule = "winter";

const CRON_MIN = 0;
const CRON_HOUR = 1;
const CRON_DOW = 4;

var tasks = [];

function loadSchedule(schedulefilename, scheduleName) {
    
    tasks.map( function(task) {
        task.destroy();
    });
    tasks = [];
    
    jsonfile.readFile(schedulefilename, function(err, allSchedules) {
        if( err ) {
            //TODO    
        }

       if( !allSchedules[scheduleName] ) {
           // TODO
       }
       var schedule = allSchedules[scheduleName];
       
       var laters = {};
       //var latersEvents = {};
       schedule.map(function(event) {
           if( !(event.zone in laters) ) { 
               laters[event.zone] = { events: {}, schedules: [] };
           }
           var cronSchedule = createSchedule(event);
           var fireEvent = function() {
               eventbus.emit('schedule.event', event);
           };
           var task = cron.schedule(cronSchedule, fireEvent);
           task.start();
           tasks.push(task);
           var sched = later.parse.cron(cronSchedule);
           
           laters[event.zone].events[later.schedule(sched).prev(1)] = fireEvent;
           laters[event.zone].schedules.push( sched.schedules[0] );
       });
       for( var zone in laters) {
           var l = laters[zone];
           var lastScheduleDate = later.schedule({ schedules: l.schedules, exceptions: [] }).prev(1);
           l.events[lastScheduleDate]();
       }

    });
};

function createSchedule(event) {
    var taskSchedule = [ "0", "0", "*", "*", "0" ];
    var time = event.time.split(':');
    taskSchedule[CRON_HOUR] = time[0];
    taskSchedule[CRON_MIN] = time[1]; 
    taskSchedule[CRON_DOW] = Array.isArray(event.days) ? event.days.join(",") : event.days ;
    if( taskSchedule[CRON_DOW].toLowerCase() == 'everyday' ) taskSchedule[CRON_DOW] = '*';
    if( taskSchedule[CRON_DOW].toLowerCase() == 'weekdays' ) taskSchedule[CRON_DOW] = '1-5';
    if( taskSchedule[CRON_DOW].toLowerCase() == 'weekends' ) taskSchedule[CRON_DOW] = '0,6';
    taskSchedule[CRON_DOW] = taskSchedule[CRON_DOW]
    .replace(/monday/gi, '1').replace(/tuesday/gi, '2').replace(/wednesday/gi, '3').replace(/thursday/gi, '4').replace(/friday/gi, '5');
    return taskSchedule.join(' ');       
}

loadSchedule(schedulefilename, activeSchedule);