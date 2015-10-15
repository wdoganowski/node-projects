"use strict";

var report_debug = require( 'debug' )( 'report' ),
    util = require( 'util' ),
    ThingSpeakClient = require( 'thingspeakclient' ),
    client = new ThingSpeakClient( {updateTimeout:20000} );

function Report (channels, interval) {
  this.channels = channels;
  this.interval = interval;
  this.init();
  setInterval( function () {
    this.tick()
  }.bind(this), interval);
}

Report.prototype.init = function() {
  for (var i = this.channels.length - 1; i >= 0; i--) {
    report_debug( 'attach channel ' + this.channels[i].id)
    client.attachChannel( this.channels[i].id, {writeKey: this.channels[i].key} );
  };
};

Report.prototype.tick = function() {
  for ( var i = this.channels.length - 1; i >= 0; i-- ) {
    var fields = {};
    for ( var j = this.channels[i].length; j > 0; j-- ) {
      fields['field' + j] = this.channels[i]['field' + j].report( this.interval );
    };
    report_debug( 'update channel ' + this.channels[i].id + ' -> ' + JSON.stringify(fields) )
    client.updateChannel( this.channels[i].id, fields );
  };
};

module.exports = Report;
