"use strict";

var util = require( 'util' ),
    nexo = require( './nexo_helper' ), 
    rules_debug = require( 'debug' )( 'rules' ),
    Timer = require( './timer' ),
    Relay = require( './relay' );

var salon_gora = new Relay( 'salon_gora', ['salo1'] ), 
    kuchnia_gora = new Relay( 'kuchnia_gora', ['kuch1', 'kotl1'] ), 
    kuchnia_dol = new Relay( 'kuchnia_dol', ['kuch2', 'kotl2'] ), 
    ogrod_zim_gora = new Relay(  'ogrod_zim_gora', ['ogro2', 'salo4'] );

var kuchnia_timer = new Timer();

var lux_low = true;

var Rules = {
  // wpp_xxx_down      - multi pressed
  // wpp_xxx_up        - multi released
  // wpp_xxx_1-6_click - clicked
  // wpp_xxx_5-6_hold  - hold 0.2s
  // wpp_xxx_5-6_down  - pressed > 1s
  // wpp_xxx_5-6_up    - released  

  //
  // Utils
  //
  init: function () {
    nexo.logic( 'ogr1lux' ); // Ask for value of the sensor
  },

  //
  // Kuchnia
  //
  wpp_kuch_down: function () {
    kuchnia_timer.reset();
    if ( kuchnia_gora.is_on && kuchnia_dol.is_on ) {
      // If both on -> off
      kuchnia_gora.off();
      kuchnia_dol.off();
    } else {
      // Otherwise both on
      kuchnia_gora.on();
      kuchnia_dol.on();
    }
  },
  wpp_kuch_1_click: function () {
    kuchnia_timer.reset();
    kuchnia_gora.toggle();
  },
  wpp_kuch_2_click: function () {
    kuchnia_timer.reset();
    kuchnia_dol.toggle();
  },
  pir_kuchnia_active: function () {
    if ( lux_low && !kuchnia_timer.is_set && !kuchnia_gora.is_on && !kuchnia_dol.is_on ) {
      nexo.relay_on( 'kuchnia_dol' );
      kuchnia_timer.set( 5*60*1000, function () {
        nexo.relay_off( 'kuchnia_dol' )
      });
    }
  },

  //
  // Kotlownia (wlacznik kolo kotlowni)
  //
  wpp_kotl_down: function () {
    this.wpp_kuch_down();
  },
  wpp_kotl_1_click: function () {
    kuchnia_timer.reset();
    kuchnia_gora.toggle();
  },
  wpp_kotl_2_click: function () {
    kuchnia_timer.reset();
    kuchnia_dol.toggle();
  },

  //
  // Przedpokoj
  //
  pir_przedpokoj_active: function (argument) {
    this.pir_kuchnia_active();
  },

  //
  // Salon
  //
  wpp_salon_down: function () {
    salon_gora.toggle();
  },
  wpp_salon_1_click: function () {
    salon_gora.toggle();
  },
  wpp_salon_4_click: function () {
    ogrod_zim_gora.toggle();
  },

  //
  // Ogrod zimowy
  //
  wpp_ogrod_down: function () {
    ogrod_zim_gora.toggle();
  },
  wpp_ogrod_2_click: function () {
    ogrod_zim_gora.toggle();
  },

  //
  // Ogrod
  //
  sens_ogrod_1_lux_low: function () {
    lux_low = true;
  },
  sens_ogrod_1_lux_high: function () {
    lux_low = false;
    kuchnia_timer.reset();
  },


}

module.exports = Rules;
