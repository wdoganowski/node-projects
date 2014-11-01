"use strict";

var fs = require('fs'),
    os = require('os'),
    util = require( 'util' ),
    njds = require('nodejs-disks'),
    nexo = require('./nexo_helper');

var interval = 60*1000,
    temperature, used_disk, ops_per_sec;

var Rpi = {
  init: function () {
    // temperature
    setInterval( function () {
      fs.readFile('/sys/class/thermal/thermal_zone0/temp', function (err, data) { 
        //Convert the output from millicentrigrades to centigrades. 
        var temperature = Math.round( parseInt(data) / 100 ) / 10;
      })     
    }, interval );
    // used disk
    setInterval( function () {
      njds.drives( function (err, drives) {
        njds.drivesDetail( drives, function (err, data) {
          /* Get drive used percentage */
          used_disk = Math.round( 1000 * parseInt(data[0].used) / parseInt(data[0].total) ) / 10;
        });
      })
    }, interval );
    // opes per second
    setInterval( function () {
      nexo.report( function (res) {
        if (res.statusCode == 200) {
          res.on('data', function (chunk) {
            var report = JSON.parse(chunk);
            ops_per_sec = Math.round( 10 * report.total / report.period ) / 10;
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
  cpu_sys: { // field
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
      return Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
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
      return 0;
    }
  },
  ops_per_sec: { // field6
    report: function () {
      return ops_per_sec;
    }
  },
}

module.exports = Rpi;   
