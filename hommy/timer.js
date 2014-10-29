"use strict";

var timer_debug = require( 'debug' )( 'timer' ),
    util = require( 'util' );

function Timer () {
  this.is_set = false;
  this.reference = null;
}

Timer.prototype.set = function(timeout, callback) {
  if ( this.is_set ) {
    timer_debug( '[set] clear');
    clearTimeout( this.reference );
  }
  this.reference = setTimeout( function() {
    timer_debug( '[set] callback');
    this.is_set = false;
    callback();
  }, timeout )
};

Timer.prototype.reset = function() {
  if ( this.is_set ) {
    timer_debug( '[reset] clear');
    clearTimeout( this.reference );
  }
  this.is_set = false;
};

module.exports = Timer;