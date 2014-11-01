"use strict";

var util = require( 'util' ),
    nexo = require( './nexo_helper' ), 
    rules_debug = require( 'debug' )( 'rules' ),
    Timer = require( './timer' ),
    Relay = require( './relay' ),
    State = require( './state' ),
    rpi = require( './rpi' );

rpi.init();

var relays = {
  salon_gora:     new Relay( 'salon_gora', ['salo1'], 14 ), 
  kuchnia_gora:   new Relay( 'kuchnia_gora', ['kuch1', 'kotl1'], 14 + 2*14/0.8 ), 
  kuchnia_dol:    new Relay( 'kuchnia_dol', ['kuch2', 'kotl2'], 2*6/0.8 ), 
  ogrod_zim_gora: new Relay( 'ogrod_zim_gora', ['ogro2', 'salo4'], 4*25 ),
}

var timers = {
  kuchnia_timer:  new Timer(),
}

var states = {
  lux_low:        new State( 'ogr1lux' ),
}

var rules = {
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
  },

  //
  // Kuchnia
  //
  wpp_kuch_down: function () {
    timers['kuchnia_timer'].reset();
    if ( relays['kuchnia_gora'].is_on && relays['kuchnia_dol'].is_on ) {
      // If both on -> off
      relays['kuchnia_gora'].off();
      relays['kuchnia_dol'].off();
    } else {
      // Otherwise both on
      relays['kuchnia_gora'].on();
      relays['kuchnia_dol'].on();
    }
  },
  wpp_kuch_1_click: function () {
    timers['kuchnia_timer'].reset();
    relays['kuchnia_gora'].toggle();
  },
  wpp_kuch_2_click: function () {
    timers['kuchnia_timer'].reset();
    relays['kuchnia_dol'].toggle();
  },
  pir_kuchnia_active: function () {
    rules_debug( 
      ' lux_low ' + states['lux_low'].is_on + 
      ' kuchnia_timer ' + timers['kuchnia_timer'].is_on + 
      ' kuchnia_gora ' + relays['kuchnia_gora'].is_on + 
      ' kuchnia_dol ' + relays['kuchnia_dol'].is_on
    );
    if ( states['lux_low'].is_on && !timers['kuchnia_timer'].is_on && 
        !relays['kuchnia_gora'].is_on && !relays['kuchnia_dol'].is_on ) {
      nexo.relay_on( 'kuchnia_dol' );
      timers['kuchnia_timer'].set( function () {
        nexo.relay_off( 'kuchnia_dol' )
      }, 5*60*1000 );
    }
  },

  //
  // Kotlownia (wlacznik kolo kotlowni)
  //
  wpp_kotl_down: this.wpp_kuch_down,
  wpp_kotl_1_click: this.wpp_kuch_1_click,
  wpp_kotl_2_click: this.wpp_kuch_2_click,

  //
  // Przedpokoj
  //
  pir_przedpokoj_active: this.pir_kuchnia_active,

  //
  // Salon
  //
  wpp_salon_down: function () {
    relays['salon_gora'].toggle();
  },
  wpp_salon_1_click: function () {
    relays['salon_gora'].toggle();
  },
  wpp_salon_4_click: function () {
    relays['ogrod_zim_gora'].toggle();
  },

  //
  // Ogrod zimowy
  //
  wpp_ogrod_down: function () {
    relays['ogrod_zim_gora'].toggle();
  },
  wpp_ogrod_2_click: function () {
    relays['ogrod_zim_gora'].toggle();
  },

  //
  // Ogrod
  //
  sens_ogrod_1_lux_low: function () {
    rules_debug( 'sens_ogrod_1_lux_low' );
    states['lux_low'].on();
  },
  sens_ogrod_1_lux_high: function () {
    states['lux_low'].off();
    timers['kuchnia_timer'].reset();
  },

  channels: [
    {
      id:     17721,
      key:    '0MF29PDE1TM12KY0',
      length: 7,
      field1: rpi.cpu_user,
      field2: rpi.cpu_sys,
      field3: rpi.memory,
      field4: rpi.disk,
      field5: rpi.temperature,
      field6: rpi.ping,
      field7: rpi.ops_per_sec,
    },
    {
      id:     17776,
      key:    'L304BT2C4TSE77IV',
      length: 1,
      field1: states['lux_low'],
    },
    {
      id:     17779,
      key:    'HCVJCBJ7J0OP4PNP',
      length: 4,
      field1: relays['salon_gora'],
      field2: relays['kuchnia_gora'],
      field3: relays['kuchnia_dol'],
      field4: relays['ogrod_zim_gora'],
    },
  ],

}

module.exports = rules;
