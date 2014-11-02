"use strict";

var settings_file = './hommy_cred.json',
    settings = require( settings_file ),
    nexo_debug = require( 'debug' )( 'nexo' ),
    util = require( 'util' ),
    http = require( 'http' );

module.exports = {

  relay_url: function (state, rel) {
    return 'http://' + settings.proxy.host + ':' + settings.proxy.port + '/' + state + '?relay=' + rel;
  },

  relay: function (rel, state) {
    nexo_debug( '[relay] ' + this.relay_url( state, rel ) );

    http.get( this.relay_url(state, rel) )
    .on( 'error', function (err) {
      nexo_debug( '[relay] error: ' + err.message );
      return false;
    })
  },

  relay_on: function (rel) {
    nexo_debug( '[relay_on] ' + rel );

    this.relay( rel, 'on' );
  },

  relay_off: function (rel) {
    nexo_debug( '[relay_off] ' + rel );

    this.relay( rel, 'off' );
  },

  relay_check: function (rel, callback) {
    nexo_debug( '[relay_check] ' + rel );

    http.get( this.relay_url( 'check', rel ), function (res) {
      nexo_debug( '[relay_check] response: ' + res.statusCode );
      res.on('data', function (chunk) {
        nexo_debug( '[relay_check] data: ' + chunk );
        callback( JSON.parse(chunk).result == 'on' );
      });
    })
    .on( 'error', function (err) {
      nexo_debug( '[relay_check] error: ' + err.message );
      callback.call( 'off' );
    })
  },

  logic: function (cmd) {
    nexo_debug( '[logic] ' + cmd );

    http.get( 'http://' + settings.proxy.host + ':' + settings.proxy.port + '/logic?payload=' + cmd )
    .on( 'error', function (err) {
      nexo_debug( '[logic] error: ' + err.message );
      return false;
    });
  },

  report: function (callback) {
    http.get( 'http://' + settings.proxy.host + ':' + settings.proxy.port + '/report', callback )
    .on( 'error', function (err) {
      nexo_debug( '[report] error: ' + err.message );
      return false;
    });
  },

}
