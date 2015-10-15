'use strict';

var debug = require( 'debug' )( 'esp_dht21' ),
    util = require( 'util' );

function ESP_DHT21 ( ip ) {
  this.ip = ip;
  this.connected = undefined;
  this.id = undefined;
  this.name = undefined;
  this.temp = {
    value:  undefined,
    report: function (interval) { return this.value }
  };
  this.hum = {
    value:  undefined,
    report: function (interval) { return this.value }
  };
  this.feels = {
    value:  undefined,
    report: function (interval) { return this.value }
  };

  this.init();
}

ESP_DHT21.prototype.init = function() {
  debug( 'checking existance of ESP_DHT21 at %s', this.ip );

  response = this.http_get( 'id' );
  if ( response ) {
    this.connected = response.connected;
    this.id = response.id;
    this.name = response.name;
  }

  this.setup();

};

ESP_DHT21.prototype.setup = function() {
  if ( this.connected ) {

    debug( 'setting up %s', this.id );
    // setup ticker
    this.http_get( '/set_ticker?params=300' );
  } else {
    debug( 'error, the ESP_DHT21 is not connected' );
  }
}

ESP_DHT21.prototype.http_get = function( uri, param ) {
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

ESP_DHT21.prototype.get_url = function( uri, param ) {
  if ( param && param <> '' ) {
    return 'http://' + this.ip + '/' + uri + '?params=' + param;
  } else {
    return 'http://' + this.ip + '/' + uri;
  }
}

module.exports = ESP_DHT21;
