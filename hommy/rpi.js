"use strict";

var rpi_debug = require( 'debug' )( 'rpi' ),
    settings = require( './hommy_cred.json' ),
    fs = require('fs'),
    os = require('os'),
    Ping = require('./ping'),
    util = require( 'util' ),
    njds = require('nodejs-disks'),
    nexo = require('./nexo_helper');

var interval = 60*1000,
    temperature, used_disk, ops_per_sec, 
    ping, ping_count, ping_total;

var Rpi;

if ( process.platform == 'darwin' ) {
  rpi_debug( '[rpi] no reports on darwin (Mac OS X)' );
  Rpi = {
    init: function () {
    },
    cpu_user: { // field1
      report: function () {
        return undefined;
      }
    },
    cpu_sys: { // field2
      report: function () {
        return undefined;
      }
    },
    memory: { // field3
      report: function () {
        return undefined;
      }
    },
    disk: { // field4
      report: function () {
        return undefined;
      }
    },
    temperature: { // field5
      report: function () {
        return undefined;
      }
    },
    ping: { // field6
      report: function () {
        return undefined;
      }
    },
    ops_per_sec: { // field6
      report: function () {
        return undefined;
      }
    },
  }
} else {
  Rpi = {
    init: function () {
      // temperature
      setInterval( function () {
        fs.readFile('/sys/class/thermal/thermal_zone0/temp', function (err, data) { 
          //Convert the output from millicentrigrades to centigrades. 
          temperature = Math.round( parseInt(data) / 100 ) / 10;
          rpi_debug( '[temperature] ' + data + ' -> ' + temperature );
        })     
      }, interval );
      // used disk
      setInterval( function () {
        njds.drives( function (err, drives) {
          njds.drivesDetail( drives, function (err, data) {
            /* Get drive used percentage */
            used_disk = Math.round( 1000 * parseInt(data[0].used) / parseInt(data[0].total) ) / 10;
          rpi_debug( '[used_disk] ' + data[0].used + ' of ' + data[0].total + ' -> ' + used_disk );
          });
        })
      }, interval );
      // ping
      Ping.configure();
      ping = new Ping( settings.nexo.host );
      ping_count = 0;
      ping_total = 0;
      ping.on('ping', function(data){
        ping_total += parseInt(data.time);
        ping_count += 1;
        // rpi_debug( '[ping] %s: time: %d ms -> %d %d', data.host, data.time, ping_count, ping_total );
      });
      // opes per second
      setInterval( function () {
        nexo.report( function (res) {
          if (res.statusCode == 200) {
            res.on('data', function (chunk) {
              var report = JSON.parse(chunk);
              ops_per_sec = Math.round( 10 * report.total / report.period ) / 10;
              rpi_debug( '[ops_per_sec] ' + report.total + ' ops per ' + report.period + 's -> ' + ops_per_sec );
            });        
          }
        })
      }, interval);
    },
    cpu_user: { // field1
      report: function () {
        var user = 0,
            total = 0,
            cpus = os.cpus();
        for ( var cpu in cpus ) {
          user += cpus[cpu].times.user;    
          for ( var type in cpus[cpu].times ) 
            total += cpus[cpu].times[type];
        }      
        return Math.round(1000 * user / total) / 10;
      }
    },
    cpu_sys: { // field2
      report: function () {
        var sys = 0,
            total = 0,
            cpus = os.cpus();
        for ( var cpu in cpus ) {
          sys += cpus[cpu].times.sys;    
          for ( var type in cpus[cpu].times ) 
            total += cpus[cpu].times[type]; 
        }      
        return Math.round(1000 * sys / total) / 10;
      }
    },
    memory: { // field3
      report: function () {
        return Math.round( ((os.totalmem() - os.freemem()) / os.totalmem()) * 100 );
      }
    },
    disk: { // field4
      report: function () {
        return used_disk;
      }
    },
    temperature: { // field5
      report: function () {
        return temperature;
      }
    },
    ping: { // field6
      report: function () {
        var ping_time;
        ping_time  = Math.round( 10 * ping_total / ping_count ) / 10; // average over interval
        ping_total = 0;
        ping_count = 0;
        return ping_time;
      }
    },
    ops_per_sec: { // field6
      report: function () {
        return ops_per_sec;
      }
    },
  }
}

module.exports = Rpi;   
