"use strict";

var settings_file = './hommy_cred.json',
    settings = require( settings_file ),
    rules = require( settings.hommy.rules ),
    hommy_debug = require( 'debug' )( 'hommy' ),
    router = new( require( 'journey' ).Router ),
    util = require( 'util' ),
    http = require( 'http' ),
    Report = require( './report' ),
    report = new Report( rules.channels, 60*1000 );

hommy_debug( 'Hommy version ' + settings.version);

// Register listener

function registerListener (addr) {
  http.get( 'http://' + settings.proxy.host + ':' + settings.proxy.port
    + '/listener?ip=' + addr + '&port=' + settings.hommy.port
    + '&uri=/call?function=%s' , function (res) {
    hommy_debug( '[listener] response: ' + res.statusCode );

    // Init
    rules.init();

  })
  .on( 'error', function (err) {
    hommy_debug( '[listener] error: ' + err.message );
    setTimeout(function() { registerListener( addr ) }, 1000);
  });
}

require('dns').lookup(require('os').hostname(), function (err, addr, fam) {
  if (addr) {
    hommy_debug( '[listener] registering ' + addr );
    registerListener ( addr );
  } else {
    hommy_debug( '[listener] can not determine ip of ' + require('os').hostname() );
    process.exit(1);
  }
})

/*
 * HTTP Server
 */

require( 'http' ).createServer( function ( request, response ) {
  hommy_debug( '[http] request ' + request.url );

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
.listen( settings.hommy.port );

/*
 * Routes
 */

router.get( '/call' ).bind( function ( req, res, params ) {
  if ( params.function ) {
    if ( rules[params.function] && typeof rules[params.function] === 'function' ) {
      setImmediate(function() {
        rules[params.function]( params );
      });
      res.send( {result: 'OK'} );
    } else {
      res.send( 404, {}, {error: 'unknown message'} );
    }
  } else {
    res.send( 400, {}, {error: 'payload required'} );
  }
});
