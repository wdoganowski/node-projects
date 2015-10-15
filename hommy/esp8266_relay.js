'use strict';

var debug = require( 'debug' )( 'esp_relay' ),
    http = require( 'http' ),
    util = require( 'util' ),
    async = require('async'),
    nexo = require( './nexo_helper' );

function ESP_Relay ( ip, leds, power ) {
  this.ip = ip;
  this.leds = [].concat( leds );
  this.power = power;
  this.connected = undefined;
  this.id = undefined;
  this.name = undefined;
  this.is_on = undefined;

  this.init();
}

ESP_Relay.prototype.init = function() {

  async.series([

    function(callback) {
      debug( 'checking existance of ESP_Relay at %s', this.ip );
      this.http_get( 'id', '', function( response ) {
        if( response ) {
          this.connected = response.connected;
          this.id = response.id;
          this.name = response.name;
        } else {
          debug( '%s timeout', this.ip );
        }
        callback();
      }.bind(this))
    }.bind( this ),

    function(callback) {
      this.sync( callback );
    }.bind( this ),

    function(callback) {
      if( !this.connected ) setTimeout( this.init(), 5*1000 );
      callback();
    }.bind( this ),

  ]);

};

ESP_Relay.prototype.sync = function( callback ) {
  // Read current state
  if( this.connected ) { 
    this.http_get( 'relay', '', function( response ) {
      if( response ) {
        this.is_on = response.relay;
        debug( 'relay is: ', this.is_on)
      }
      this.led( this.is_on?'on':'off' );
      callback();
    }.bind( this ));
  } else {
    callback();
  }
};

ESP_Relay.prototype.led = function(state) {
  // Switch leds on
  for (var i = this.leds.length - 1; i >= 0; i--) {
    nexo.logic( this.leds[i] + state );
  };
};

ESP_Relay.prototype.set_state = function(state) {
  // Set relay
  this.is_on = state;
  this.http_get( 'set_relay', state, function( response ) {
    if( response ) {
      this.is_on = response.return_value;
      debug( 'relay is: ', this.is_on)
    }
    this.led( this.is_on?'on':'off' );
  }.bind(this));
};

ESP_Relay.prototype.on = function() {
  // Switch relay on
  debug( 'on' );
  this.set_state( true );
};

ESP_Relay.prototype.off = function() {
  // Switch relay off
  debug( 'off' );
  this.set_state( false );
};

ESP_Relay.prototype.toggle = function() {
  // Toggle the switch
  if ( this.is_on ) {
    this.off();
  } else {
    this.on();
  }
};

ESP_Relay.prototype.report = function(interval) {
  return this.is_on? Math.round( this.power * interval / (60*60) ) / 1000 : 0; // value in Wh converted to interval
};

ESP_Relay.prototype.http_get = function( uri, param, callback ) {
  http.get( this.get_url(uri, param), function (res) {
    debug( 'response: ' + res.statusCode );
    res.on('data', function (chunk) {
      debug( 'data: ' + chunk );
      callback( JSON.parse(chunk) );
    });
  })
  .on( 'error', function (err) {
    debug( 'error: ' + err.message );
    callback( undefined );
  })
}

ESP_Relay.prototype.get_url = function( uri, param ) {
  if ( param && param != '' ) {
    debug( 'url: ' + 'http://' + this.ip + '/' + uri + '?params=' + param );
    return 'http://' + this.ip + '/' + uri + '?params=' + param;
  } else {
    debug( 'url: ' + 'http://' + this.ip + '/' + uri  );
    return 'http://' + this.ip + '/' + uri;
  }
}

module.exports = ESP_Relay;
