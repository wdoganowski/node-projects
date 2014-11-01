"use strict";

var fs = require('fs'),
    os = require('os'),
    njds = require('nodejs-disks');

var interval = /*60**/1000,
    temp, used_disk;

var Rpi = {
  init: function () {
    // temperature
    setInterval( function () {
      fs.readFile('/sys/class/thermal/thermal_zone0/temp', function (err, data) { 
        //Convert the output from millicentrigrades to centigrades. 
        var temp = Math.round( parseInt(data) / 100 ) / 10;
      })     
    }, interval );
    // used disk
    setInterval ( function () {
      njds.drives( function (err, drives) {
        njds.drivesDetail( drives, function (err, data) {
          var total = 0,
              used_disk = 0;
          for(var i = 0; i<data.length; i++) {
            /* Get drive used percentage */
            used_disk += parseInt( data[i].used );
            total += parseInt( data[i].total );
          }
          used_disk = Math.round( 1000 * used_disk / total ) / 10;
        });
      })
    }, interval );
  },
  cpu_user: {
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
  cpu_sys: {
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
  memory: {
    report: function () {
      return Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    }
  },
  disk: {
    report: function () {
      return used_disk;
    }
  },
  temperature: {
    report: function () {
      return temp;
    }
  },
  ping: {
    report: function () {
      return 0;
    }
  },
}

module.exports = Rpi;   
