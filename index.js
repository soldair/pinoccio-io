// woo
var pinoccio = require('pinoccio')
var Emitter = require("events").EventEmitter;
var util = require('util');
var xtend = require('xtend');
var pinnum = require('./lib/pinnum');

// there are more pins but they are already connected to a bunch of cool things.
// im not sure the right way to manage it.
// https://github.com/Pinoccio/core-pinoccio/blob/master/avr/variants/pinoccio/pins_arduino.h
var pins = [
  { id: "D2", modes: [0, 1, 3, 4] },
  { id: "D3", modes: [0, 1, 3, 4] },
  { id: "D4", modes: [0, 1, 3, 4] },
  { id: "D5", modes: [0, 1, 3, 4] },
  { id: "D6", modes: [0, 1] },
  { id: "D7", modes: [0, 1] },
  { id: "D8", modes: [0, 1] },
  { id: "A0", modes: [0, 1, 2] },
  { id: "A1", modes: [0, 1, 2] },
  { id: "A2", modes: [0, 1, 2] },
  { id: "A3", modes: [0, 1, 2] },
  { id: "A4", modes: [0, 1, 2] },
  { id: "A5", modes: [0, 1, 2] },
  { id: "A6", modes: [0, 1, 2] },
  { id: "A7", modes: [0, 1, 2] }
];

var modes = {
  RESERVED:-2, // pinoccio
  DISABLED:-1, // pinoccio 
  FLOAT:0, // pinoccio
  INPUT: 2,
  OUTPUT: 1,
  ANALOG:2, // -io interface looks like setting pin mode to input
  PWM: 3,
  SERVO: 4 // todo
};


module.exports = PinoccioIO;

function PinoccioIO(opts){

  if (!(this instanceof PinoccioIO)) {
    return new PinoccioIO(opts);
  }
  var z = this;
 
  Emitter.call(z);

  z._api = pinoccio(opts.token);

  z.troop = opts.troop;
  z.scout = opts.scout;

  z._api.rest({url:'v1/'+opts.troop+'/'+opts.scout},function(err,data){

    if(err) return z.emit('error',err);

    z.sync = z._api.sync();

    z.data = {};// sync data object.

    // board is ready after i get  available && digital && analog events.
    // TODO FIND GREAT Way to message when a scout may be off / unavailable 
    var isReady = function(){
      return (z.data.available && z.data.available.available) && z.data.digital && z.data.analog;
    };


    z.sync.on('data',function(data){
      // i care about 3 api events
      //
      // available: {"scout":1,"available":1,"reply":"11\n","_t":1399594464252,"type":"available"}
      // digital:   {"type":"digital","mode":[-1,-1,-1,-1,2,-1,-1],"state":[-1,-1,-1,-1,0,-1,-1],"_t":1396672122237}
      // analog:    {"type":"analog","mode":[-1,-1,-1,-1,-1,-1,-1,-1],"state":[-1,-1,-1,-1,-1,-1,-1,-1],"_t":1396651237836}
      //

      if(data.account && data.troop == z.troop && data.scout == z.scout && data.type) {

        var key = data.type
        z.data[key] = data.value||data;
        
        if(key == 'digital' || key == 'analog') {
          var offset = key == 'analog'?7:0;
          var report = data.value;
          
          report.mode.forEach(function(mode,i){
            var value = report.digital.state[i];
            var pin = z.pins[offset+i];
            var change = false;
            if(mode != pin.mode) {
              change = true;
              pin.mode = mode;
            } 

            if(value != pin.value) {
              change = true;
              pin.value = value;
            } 

            if(this.isReady) {
              z.emit(key+'-pin-'+i);
            }
          });

          if(isReady()) {
            z.isReady = true;
            z.emit('ready');
          }
        }
      }
    }).on('error',function(err){
      z.emit('error',err);
    });

  }); 

  z.pins = pins.map(function(pin) {
    return {
      supportedModes: pin.modes,
      mode: -1, // disabled. waiting for push from api.
      value: 0
    };  
  }); 

  this.analogPins = this.pins.slice(7).map(function(pin, i) {
    return i;
  }); 

}


util.inherits(PinoccioIO.prototype,Emitter);

xtend(PinoccioIO.prototype,{
  name:"pinoccio-io",
  isReady:false,
  HIGH:1,
  LOW:1,
  pins:[],
  // handle to api.
  _api:false,
  // placeholder for setSamplingInterval
  _interval:19,
  // state 
  _state:{}
  pinMode:function(pin){

  },
  analogWrite:function(pin,value){

  },
  pinWrite:function(){
     
  },
  digitalRead:function(pin,handler){
    return this.pinRead(pin,handler);
  },
  analogRead:function(pin,handler){
    return this.pinRead(pin+7,handler);
  },
  pinRead:function(pin,handler){
    var type = pin < 8 ?'digital':'analog';
    this.on(type+'-pin-'+pin,handler);
    return this;
  },
  servoWrite:function(){
    
  },
  _command:function(command){
    this._api.rest({url:'/v1/'+this.troop+'/'+this.scout+'/command',{command:command}},function(){
      
    })
  }
});



Pinoccio.prototype.servoWrite = analogWrite;


Pinoccio.prototype.setSamplingInterval = function(interval) {
  // This does not send a value to the board
  // this sets the analog sampling interval.

  var safeint = interval < 100 ?
    100 : (interval > 65535 ? 65535 : interval);

  // events.setCycle(ditialEvents,analogEvents,peripheral sampling interval (temp battery etc))

  this._api.rest('/v1/'+this.troop+'/'+this.scout+'/command'.data:{command:"events.setCycle(50,)"}})

  return this;
};

Pinoccio.prototype.reset = function() {
  return this;
};

Pinoccio.prototype.close = function() {
  if(this.sync) this.sync.end();
};



