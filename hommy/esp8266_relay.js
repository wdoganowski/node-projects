'use strict';

var debug = require( 'debug' )( 'esp_relay' ),
    util = require( 'util' );

function ESP_Relay ( ip, leds, power ) {
  this.ip = ip;
  this.leds = [].concat( leds );
  this power = power;
  this.connected = undefined;
  this.id = undefined;
  this.name = undefined;
  this.is_on = undefined;

  this.init();
}

ESP_Relay.prototype.init = function() {
  debug( 'checking existance of ESP_Relay at %s', this.ip );

  response = this.http_get( 'id' );
  if ( response ) {
    this.connected = response.connected;
    this.id = response.id;
    this.name = response.name;
  }

  this.sync();

};

Relay.prototype.led = function(state) {
  // Switch leds on
  for (var i = this.leds.length - 1; i >= 0; i--) {
    nexo.logic( this.leds[i] + state );
  };
};

ESP_Relay.prototype.sync = function() {
  // Read current state
  this.is_on = this.http_get( 'relay' ).relay;
  this.led( is_on?'on':'off' );
};

ESP_Relay.prototype.on = function() {
  // Switch relay on
  this.is_on = true;
  this.http_get( 'set_relay', this.is_on )
  this.led( 'on' );
};

ESP_Relay.prototype.off = function() {
  // Switch relay off
  this.is_on = false;
  this.http_get( 'set_relay', this.is_on )
  this.led( 'off' );
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

ESP_Relay.prototype.http_get = function( uri, param ) {
  http.get( this.get_url(uri, param), function (res) {
    nexo_debug( '[ESP_DHT21 response: ' + res.statusCode );
    res.on('data', function (chunk) {
      nexo_debug( '[ESP_DHT21] data: ' + chunk );
      return JSON.parse(chunk);
    });
  })
  .on( 'error', function (err) {
    nexo_debug( '[ESP_DHT21] error: ' + err.message );
    return false;
  })
}

ESP_Relay.prototype.get_url = function( uri, param ) {
  if ( param && param <> '' ) {
    return 'http://' + this.ip + '/' + uri + '?params=' + param;
  } else {
    return 'http://' + this.ip + '/' + uri;
  }
}

module.exports = ESP_Relay;
