"use strict";

var timer_debug = require( 'debug' )( 'timer' ),
    util = require( 'util' );

function Timer () {
  this.is_on = false;
  this.reference = null;
  this.callback = undefined;
}

Timer.prototype.set = function(callback, timeout) {
  if ( this.is_on ) {
    timer_debug( '[set] clear');
    clearTimeout( this.reference );
  }
  this.is_on = true;
  this.callback = callback;
  this.reference = setTimeout( function() {
    timer_debug( '[callback] ' + this.callback );
    this.is_on = false;
    if (this.callback) this.callback();
    this.callback = undefined;
  }.bind(this), timeout )
};

Timer.prototype.reset = function() {
  if ( this.is_on ) {
    timer_debug( '[reset] clear');
    this.is_on = false;
    clearTimeout( this.reference );
    if (this.callback) this.callback();
    this.callback = undefined;
  }
};

module.exports = Timer;