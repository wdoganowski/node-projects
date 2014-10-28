"use strict";

var util = require( 'util' ),
    nexo = require( './nexo_helper' ), 
    rules_debug = require( 'debug' )( 'rules' );

var Rules = {

  init: function () {
    nexo.relay_check( 'rel-salon', function (v) {global.salon = v});
  },

  // Salon
  dsal6: function () {global.salon = nexo.relay_toggle( 'dsal6', 'rel-salon', global.salon )}

}

module.exports = Rules;
