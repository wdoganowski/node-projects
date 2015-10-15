'use strict';

var debug = require( 'debug' )( 'esp_dht21' ),
    http = require( 'http' ),
    async = require('async'),
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

  async.series([

    function(callback) {
      debug( 'checking existance of ESP_DHT21 at %s', this.ip );
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
      debug( 'setting up %s', this.id );
      this.http_get( 'set_ticker', 300, function() { callback() } );
    }.bind( this ),

    function(callback) {
      this.sync( callback );
    }.bind( this ),

    function(callback) {
      if( !this.connected ) setTimeout( function(){
        this.init()
      }.bind( this ), 5*1000 );
      callback();
    }.bind( this ),

  ]);

};

ESP_DHT21.prototype.sync = function( callback2 ) {
  debug( 'sync %s', this.id );
  // read parameters

  if( this.connected ) {
    async.series ([

    // temperature
    function(callback) {
      this.http_get( 'temperature', '', function( response ) {
        if( response ) {
          this.temp.value = response.temperature;
          debug( 'temperature: ', this.temp.value );
        }
        callback();
      }.bind(this))
    }.bind( this ),

    // humidity
    function(callback) {
      this.http_get( 'humidity', '', function( response ) {
        if( response ) {
          this.hum.value = response.humidity;
          debug( 'humidity: ', this.hum.value );
        }
        callback();
      }.bind(this))
    }.bind( this ),

    // feels like
    function(callback) {
      this.http_get( 'feelslike', '', function( response ) {
        if( response ) {
          this.feels.value = response.feelslike;
          debug( 'feels like: ', this.feels.value );
        }
        callback();
      }.bind(this))
    }.bind( this ),

    function(callback) {
      callback2();
    },

  ])}  else {
    debug( 'not connected' );
    callback2();
  }  
}

ESP_DHT21.prototype.http_get = function( uri, param, callback ) {
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
