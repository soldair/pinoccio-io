// woo
var pinoccio = require('pinoccio')
var Emitter = require("events").EventEmitter;
var xtend = require('xtend');
var pinnum = require('./lib/pinnum');

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
 
  Emitter.call(this);

}

PinoccioIO.prototype = new Emitter;
xtend(PinoccioIO.prototype,{
  name:"pinoccio-io",
  isReady:false,
  HIGH:1,
  LOW:1,
  pins:[],
  // placeholder for setSamplingInterval
  _interval:19,
  // state 
  _state:{}
});



{
  pins:{},
  pinMode:function(){

  },
  analogWrite:function(){

  },
  digitalWrite:function(){

  },
  analogRead:function(){

  },
  digtalRead:function(){

  },
  servoWrite:function(){

  },
  
});


Pinoccio.prototype.setSamplingInterval = function(interval) {
  // This does not send a value to the board
  var safeint = interval < 10 ?
    10 : (interval > 65535 ? 65535 : interval);

  this._interval = safeint;

  return this;
};

Pinoccio.prototype.reset = function() {
  return this;
};

Pinoccio.prototype.close = function() {
};



