"use strict";

var relay_debug = require( 'debug' )( 'relay' ),
    util = require( 'util' ),
    nexo = require( './nexo_helper' );

function Relay (relay, leds, power) {
  // Set properties
  this.relay = relay;
  this.leds = [].concat( leds );
  this.is_on = false;
  this.power = power;

  this.sync();
}

Relay.prototype.sync = function() {
  // Read current state
  nexo.relay_check( this.relay, function (is_on) {
    this.is_on = is_on;
    this.led( is_on?'on':'off' );
  }.bind(this) );
};

Relay.prototype.led = function(state) {
  // Switch leds on
  for (var i = this.leds.length - 1; i >= 0; i--) {
    nexo.logic( this.leds[i] + state );
  };
};

Relay.prototype.on = function() {
  // Switch relay on
  this.is_on = true;
  nexo.relay_on( this.relay );
  this.led( 'on' );
};

Relay.prototype.off = function() {
  // Switch relay off
  this.is_on = false;
  nexo.relay_off( this.relay );
  this.led( 'off' );
};

Relay.prototype.toggle = function() {
  // Toggle the switch
  if (this.is_on) {
    this.off();
  } else {
    this.on();
  }
};

Relay.prototype.report = function(interval) {
  return this.is_on? Math.round( this.power * interval / (60*60) ) / 1000 : 0; // value in Wh converted to interval
};

module.exports = Relay;
