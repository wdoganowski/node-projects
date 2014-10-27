"use strict";

var util = require( 'util' ),
    nexo = require( './nexo_helper' ), 
    rules_debug = require( 'debug' )( 'rules' );

module.exports = 
{

  init: function () {
    nexo.relay_check( 'rel-salon', function (v) {global.salon = v});
  },

  test: function (p) { 
    rules_debug ( '[test]' );
  },

  // Salon
  dsal6: function () {
    rules_debug ( '[dsal6] > ' + global.salon );

    if (global.salon) {
      nexo.relay_off( 'rel-salon' );
      nexo.logic( 'dsal6lf' );
      global.salon = false;

    } else {
      nexo.relay_on( 'rel-salon' );
      nexo.logic( 'dsal6lo' );
      global.salon = true;
    }
  }

}
