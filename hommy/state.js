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
  state_debug( '[on]' );
  this.is_on = true;
};

State.prototype.off = function() {
  state_debug( '[off]' );
  this.is_on = false;
};

State.prototype.toggle = function() {
  state_debug( '[toggle] ' +  this.is_on + ' -> ' + !this.is_on );
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