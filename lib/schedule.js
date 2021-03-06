var jsonfile = require('jsonfile');
var eventbus = require('./eventbus.js');
var later = require('later');
var logger = require('./logger')('schd');
var _ = require('underscore');


var schedulefilename = __dirname + "/../etc/schedule.json";
var activeSchedule;

const CRON_MIN = 0;
const CRON_HOUR = 1;
const CRON_DOW = 4;

const SCHEDULE_KEYS = ['state', 'zone', 'time', 'days'];
const SCHEDULE_KEYS_OVERRIDE = ['state', 'zone'];

var tasks = [];

function loadSchedule(schedulefilename, scheduleName) {
    
    while( tasks.length ) {
        tasks.pop().clear();
    }

    jsonfile.readFile(schedulefilename, function(err, allSchedules) {
        if( err ) {
            //TODO    
            throw err;
        }
        
        if( allSchedules.length == 0 ) {
            logger.error("Schedule is empty: "+schedulefilename);
            return;
        }
        
        if( typeof scheduleName !== 'undefined' && !(scheduleName in allSchedules) ) {
           logger.error('Schedule does not exist: '+scheduleName);
           activeSchedule = typeof activeSchedule !== 'undefined' ? activeSchedule : Object.keys(allSchedules)[0];
        } else {
           activeSchedule = typeof scheduleName !== 'undefined' ? scheduleName : Object.keys(allSchedules)[0];
        }
        logger.info('Loading '+activeSchedule+' schedule');
       
        var schedule = allSchedules[activeSchedule];
        
        var laters = {};
        //var latersEvents = {};
        schedule.map(function(event) {
           if( !(event.zone in laters) ) { 
               laters[event.zone] = { events: {}, schedules: [] };
           }
           var cronSchedule = createSchedule(event);
           event.schedule = scheduleName;
           var fireEvent = function() {
               logger.info('Firing a schedule event for zone ' + event.zone );
               eventbus.emit('schedule.event', event);
           };
           var sched = later.parse.cron(cronSchedule);
           tasks.push( later.setInterval( fireEvent, sched ));
           
           laters[event.zone].events[later.schedule(sched).prev(1)] = fireEvent;
           laters[event.zone].schedules.push( sched.schedules[0] );
        });
        for( var zone in laters) {
           var l = laters[zone];
           var lastScheduleDate = later.schedule({ schedules: l.schedules, exceptions: [] }).prev(1);
           l.events[lastScheduleDate]();
        }
        
        eventbus.emit('schedule', { schedule: activeSchedule });

    });
}

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

eventbus.on('schedule.request', function(msg) {
    if( ! _.every(SCHEDULE_KEYS_OVERRIDE, v=>{ return _.has(msg,v )} )) {
        logger.error('SCHEDULE: schedule.request must contain: '+ SCHEDULE_KEYS_OVERRIDE.join(", "));
        return;
    }
    eventbus.emit('schedule.event', msg);
});

eventbus.on('schedule.change', function(msg) {
   loadSchedule(schedulefilename, msg.schedule); 
});