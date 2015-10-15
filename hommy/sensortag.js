"use strict";

var debug = require( 'debug' )( 'sensortag' ),
    util = require( 'util' ),
    async = require('async'),
    sensorTag = require( 'sensortag' );

function SensorTag ( uuid ) {
  this.uuid = uuid;
  this.sensorTag = undefined;
  this.temp = {
    value:  undefined,
    report: function (interval) { return this.value }
  };
  this.hum = {
    value:  undefined,
    report: function (interval) { return this.value }
  };

  this.init();
}

SensorTag.prototype.init = function() {
  debug( 'discovering with filter %s', this.uuid );
  sensorTag.discover( function( sensorTag ) {

    if ( sensorTag.uuid == this.uuid ) {
      this.sensorTag = sensorTag;

      this.sensorTag.on('disconnect', function() {
        debug( 'disconnected %s', this.uuid );
        setTimeout( this.setup(), 1000 ); // setup again
      }.bind( this ));

      this.setup();

    } else {
      debug( 'wrong uuid, should be %s not %s', this.uuid, sensorTag.uuid );
      this.sensorTag = undefined;
      // re-discover
      setTimeout( this.init(), 1000 );
    }

  }.bind( this ), this.uuid );
};

SensorTag.prototype.setup = function() {
  if ( this.sensorTag ) {

    debug( 'setting up uuid %s', this.uuid );
    async.series([

      // Connecting

      function(callback) {
        debug( 'connecting uuid %s', this.uuid );
        this.sensorTag.connect(callback);
      }.bind( this ),

      function(callback) {
        debug( 'connected uuid %s', this.uuid );
        this.sensorTag.discoverServicesAndCharacteristics(callback);
      }.bind( this ),

      // reading info

      function(callback) {
        this.sensorTag.readDeviceName( function(deviceName) {
          debug( '\tdevice name = ' + deviceName );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readSystemId( function(systemId) {
          debug( '\tsystem id = ' + systemId );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readSerialNumber( function(serialNumber) {
          debug( '\tserial number = ' + serialNumber );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readFirmwareRevision( function(firmwareRevision) {
          debug( '\tfirmware revision = ' + firmwareRevision );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readHardwareRevision( function(hardwareRevision) {
          debug( '\thardware revision = ' + hardwareRevision );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readHardwareRevision( function(softwareRevision) {
          debug( '\tsoftware revision = ' + softwareRevision );
          callback();
        });
      }.bind( this ),

      function(callback) {
        this.sensorTag.readManufacturerName( function(manufacturerName) {
          debug( '\tmanufacturer name = ' + manufacturerName );
          callback();
        });
      }.bind( this ),

      // Enabling humidity & temperature

      function(callback) {
        debug( 'enabling humidity uuid %s', this.uuid );
        this.sensorTag.enableHumidity(callback);
      }.bind( this ),

      function(callback) {
        debug( 'enabling humidity notification uuid %s', this.uuid );
	this.sensorTag.on( 'humidityChange', function(temperature, humidity) {
           this.temp.value = temperature.toFixed(1);
           this.hum.value = humidity.toFixed(1);
           // debug( 'temperature = ' + this.temp.value + ' °C\thumidity = ' + this.hum.value + ' %' );
        }.bind( this ) );
        this.sensorTag.notifyHumidity(callback);
      }.bind( this ),

    ]);
  } else {
    debug( 'error, the sensorTag is not set' );
  }
}

SensorTag.prototype.readInfo = [


]

module.exports = SensorTag;
