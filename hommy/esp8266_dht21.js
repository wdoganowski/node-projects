'use strict';

var debug = require( 'debug' )( 'esp_dht21' ),
    http = require( 'http' ),
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

  var response;
  if( this.http_get( 'id', '', response ) ) {
    this.connected = response.connected;
    this.id = response.id;
    this.name = response.name;
  } else {
    
  }

  debug( 'setting up %s', this.id );
  // setup ticker
  this.http_get( 'set_ticker', 300 );
  
  this.sync();

};

ESP_DHT21.prototype.sync = function() {
  debug( 'sync %s', this.id );
  // read parameters
  var response;
  if( this.http_get( 'temperature', '', response ) ) this.temp.value = response.temperature;
  debug( this.temp.value );
}

ESP_DHT21.prototype.http_get = function( uri, param, res ) {
  http.get( this.get_url(uri, param), function (res) {
    debug( 'response: ' + res.statusCode );
    res.on('data', function (chunk) {
      debug( 'data: ' + chunk );
      res = JSON.parse(chunk);
      return true;
    });
  })
  .on( 'error', function (err) {
    debug( 'error: ' + err.message );
    return false;
  })
}

ESP_DHT21.prototype.get_url = function( uri, param ) {
  if ( param && param != '' ) {
    debug( 'url: ' + 'http://' + this.ip + '/' + uri + '?params=' + param );
    return 'http://' + this.ip + '/' + uri + '?params=' + param;
  } else {
    debug( 'url: ' + 'http://' + this.ip + '/' + uri );
    return 'http://' + this.ip + '/' + uri;
  }
}

module.exports = ESP_DHT21;
