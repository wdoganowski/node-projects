'use strict';

/*
 * Nexo Client
 */

var settings_file = './nexo_cred.json',
    settings = require( settings_file ),
    fs = require( 'fs' ),
    client_debug = require( 'debug' )( 'client' ),
    Nexo = require( 'nexo' ),
    nexo = new Nexo(),
    http = require( 'http' ),
    message_listener = null,
    sprintf = require("sprintf-js").sprintf,
    RpiLeds = require( 'rpi-leds' ),
    leds = new RpiLeds();

var stat_interval_counter = 0,    // counts number of stat intervals
    stat_operations_counter = 0,  // total number of operations per interval
    current_operations_count = 0; // number of operations per interval

leds.status.heartbeat(); // status led will send heartbeat until the report will be called by client

nexo.setConfig( settings.nexo );

nexo.connectTo( function connected () {
  client_debug(' CONNECTED TO: ' + nexo.host + ':' + nexo.port );

  setInterval( function() {
    stat_interval_counter += 1;
    // in case the stats were not read in 100 secs - error with heartbeat
    if ( stat_interval_counter > 100 ) leds.status.heartbeat();
    stat_operations_counter += current_operations_count;
    current_operations_count = 0 ;
  }, 1000);

  nexo.on( 'close', reconnect );
  poolingLoop();
})

function poolingLoop () {
  current_operations_count += 1;
  nexo.poolFrom( function () {
    if ( nexo.bufferLength() ) {
      var buff = nexo.readBuffer();
      client_debug( 'Message ' + buff );
      if (message_listener) {
        client_debug( sprintf( message_listener, buff ) );
        http.get( sprintf( message_listener, buff ) /*, function (res) {
          client_debug( 'response: ' + res.statusCode );
        }*/).on( 'error', function (err) {
          client_debug( 'error: ' + err.message );
        });
      } else {
        client_debug( 'Message listener not registered' );
      }
    }
    setImmediate( poolingLoop );
  });
}

function reconnect () {
  client_debug( 'END' );
  nexo.connectTo( function connected () {
    client_debug( 'RENNECTED TO: ' + nexo.host + ':' + nexo.port );
    poolingLoop();
  });
}

/*
 * Proxy server
 */

var proxy_debug = require( 'debug' )( 'proxy' ),
    router = new( require( 'journey' ).Router ),
    util = require( 'util' );

router.get( '/message' ).bind(function ( req, res, params ) {
  if ( params.payload ) {
    if (message_listener) {
      setImmediate( function() {
        http.get( sprintf( message_listener, params.payload ) );
      });
      res.send( {response:'OK'} );
    } else {
      res.send( 404, {}, {error: 'Message listener not registered'} );
    }
  } else {
    res.send( 400, {}, {error: 'payload required'} );
  }
});

router.get( '/version' ).bind(function ( req, res ) {
  res.send( {version: settings.version} );
});

router.get( '/report' ).bind(function ( req, res ) {
  res.send({
    total: stat_operations_counter, // number of ops counted
    period: stat_interval_counter,  // [s]
  });
  // When there is no ops with Nexo, send hartbeat, otherwise just blink
  if ( current_operations_count ) {
    leds.status.blink()
  } else {
    leds.status.heartbeat()
  }
  stat_operations_counter = 0;
  stat_interval_counter = 0;
  current_operations_count = 0;
});

function checkState ( relay, res ) {
  nexo.checkState(relay, function () {
    var temp = nexo.readBuffer().replace( relay + ' jest ', '' );
    switch ( temp ) {
      case 'wlaczone':
        res.send( {result: 'on'} );
        break;
      case 'wylaczone':
        res.send( {result: 'off'} );
        break;
      default:
        res.send( 404, {}, {error: 'unknown result ' + temp} );
    }
  });
};

router.get( '/on' ).bind( function ( req, res, params ) {
  if ( params.relay ) {
    nexo.switchOn( params.relay, function () {
      res.send( {response:'OK'} );
    });
  } else {
    res.send( 400, {}, {error: 'relay required'} );
  }
});

router.get( '/off' ).bind( function ( req, res, params ) {
  if ( params.relay ) {
    nexo.switchOff( params.relay, function () {
      res.send( {response:'OK'} );
    });
  } else {
    res.send( 400, {}, {error: 'relay required'} );
  }
});

router.get( '/check' ).bind( function ( req, res, params ) {
  if ( params.relay ) {
    checkState( params.relay, res );
  } else {
    res.send( 400, {}, {error: 'relay required'} );
  }
});

router.get( '/logic' ).bind( function ( req, res, params ) {
  if ( params.payload ) {
    nexo.sendLogic( params.payload, function () {
      res.send( {response:'OK'} );/*nexo.poolFrom( function () {
        var temp = nexo.readBuffer ();
        mqtt_client.publish( settings.mqtt.root + '/logic', temp );
        res.send( {response: temp} );
      });*/
    });
  } else {
    res.send( 400, {}, {error: 'payload required'} );
  }
});

router.get( '/read' ).bind( function ( req, res, params ) {
  nexo.poolFrom( function () {
    res.send( nexo.readBuffer() );
  });
});

function isInt (n) {
  return typeof n=="number" && isFinite(n) && n%1===0;
}

router.get( '/listener' ).bind( function ( req, res, params ) {
  if ( params.ip && params.port && params.uri ) {
    message_listener = params.url;
    proxy_debug( 'Listener registered http://' + params.ip + ':' + params.port + params.uri );
    message_listener = 'http://' + params.ip + ':' + params.port + params.uri;
    res.send( {result: 'OK'} );
  } else {
    res.send( 400, {}, {error: 'ip, port & uri required'} );
  }
});

/*
 * HTTP Proxy
 */

if ( settings.proxy.host == '127.0.0.1' ||  settings.proxy.host == '::1' || settings.proxy.host == 'localhost' ) {
  require( 'http' ).createServer( function ( request, response ) {
    proxy_debug( 'Request ' + request.url );

    var body = "";

    request.addListener( 'data', function (chunk) { body += chunk } );
    request.addListener( 'end', function () {
        //
        // Dispatch the request to the router
        //
        router.handle( request, body, function (result) {
            response.writeHead( result.status, result.headers );
            response.end( result.body );
        });
    });
  })

  .listen( settings.proxy.port );
}
