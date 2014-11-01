"use strict";

var state_debug = require( 'debug' )( 'state' ),
    util = require( 'util' ),
    nexo = require( './nexo_helper' );

function State (state) {
  // Set properties
  this.state = state;
  this.is_on = false;

  this.sync();
}

State.prototype.sync = function() {
  // Read current state
  nexo.logic( this.state );
};

State.prototype.on = function() {
  this.is_on = true;
};

State.prototype.off = function() {
  this.is_on = false;
};

State.prototype.toggle = function() {
  if (this.is_on) {
    this.off();
  } else {
    this.on();
  }
};

State.prototype.report = function() {
  return this.is_on?1:0;
};

module.exports = State;