"use strict";

var settings_file = './hommy_cred.json',
    settings = require( settings_file ),
    pioneer_debug = require( 'debug' )( 'pioneer' ),
    util = require( 'util' ),
    nexo = require( './nexo_helper' ),
    http = require( 'http' );

function pioneer (leds, power) {
  // Set properties
  this.leds = [].concat( leds );
  this.is_on = false;
  this.power = power;

  this.sync();
}


pioneer.prototype.url = function(state) {
  return 'http://' + settings.remmoty.host + ':' + settings.remmoty.port + '/cgi-bin/pioneer?' + state;
},

pioneer.prototype.command = function(state) {
  pioneer_debug( '[pioneer] ' + this.url( state ) );

  http.get( this.url( state ) )
  .on( 'error', function (err) {
    pioneer_debug( '[pioneer] error: ' + err.message );
    return false;
  })
},

pioneer.prototype.sync = function() {
  // Status reading not supported - switch off by default
  this.off();
};

pioneer.prototype.led = function(state) {
  // Switch leds on
  for (var i = this.leds.length - 1; i >= 0; i--) {
    nexo.logic( this.leds[i] + state );
  };
};

pioneer.prototype.on = function() {
  // Swithc pioneer on
  this.is_on = true;
  this.command( 'on' );
  this.led( 'on' );
};

pioneer.prototype.off = function() {
  // Swithc pioneer on
  this.is_on = false;
  this.command( 'off' );
  this.led( 'off' );
};

pioneer.prototype.toggle = function() {
  // Toggle the switch
  if (this.is_on) {
    this.off();
  } else {
    this.on();
  }
};

pioneer.prototype.report = function(interval) {
  return this.is_on? Math.round( this.power * interval / (60*60) ) / 1000 : 0; // value in Wh converted to interval
};

module.exports = pioneer;
