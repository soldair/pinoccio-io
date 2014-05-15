var pinoccio = require('pinoccio')
var Emitter = require("events").EventEmitter;
var util = require('util');

// there are more pins but they are already connected to a bunch of cool things.
// im not sure the right way to manage it. io.led?
// https://github.com/Pinoccio/core-pinoccio/blob/master/avr/variants/pinoccio/pins_arduino.h
var pins = [
  { id: "D0", modes: [-2] }, //always reserved
  { id: "D1", modes: [-2] }, //always reserved
  { id: "D2", modes: [0, 1, 3, 4] },
  { id: "D3", modes: [0, 1, 3, 4] },
  { id: "D4", modes: [0, 1, 3, 4] },
  { id: "D5", modes: [0, 1, 3, 4] },
  { id: "D6", modes: [0, 1] }, // reserved on lead scout. sdcard 
  { id: "D7", modes: [0, 1] }, // reserved on lead scout. wifi
  { id: "D8", modes: [0, 1] }, // reserved on lead scout. wifi
  { id: "A0", modes: [0, 1, 2] },
  { id: "A1", modes: [0, 1, 2] },
  { id: "A2", modes: [0, 1, 2] },
  { id: "A3", modes: [0, 1, 2] },
  { id: "A4", modes: [0, 1, 2] },
  { id: "A5", modes: [0, 1, 2] },
  { id: "A6", modes: [0, 1, 2] },
  { id: "A7", modes: [0, 1, 2] }
];

// 
//                 -2           -1         0        1         2       3
//var pinModes = ['reserved', 'disabled', 'float', 'output', 'input', 'pwm'];
var modes = {
  RESERVED:-2, // pinoccio
  DISABLED:-1, // pinoccio 
  FLOAT:0, // pinoccio 
  INPUT: 2,
  OUTPUT: 1,
  // im not sure about this here. in spark-io he expects 2 saves 2 to the pins array as the mode for the pin but passes 0 to the board 
  ANALOG:0, 
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

  z._api = pinoccio(opts);

  z.troop = opts.troop;
  z.scout = opts.scout;

  z._api.rest({url:'v1/'+opts.troop+'/'+opts.scout},function(err,data){

    if(err) return z.emit('error',err);
    if(!data) return z.emit('error',new Error('unknown troop or scout'));


    z.sync = z._api.sync();

    z.data = {};// sync data object.

    // board is ready after i get  available && digital && analog events.
    // TODO FIND GREAT Way to message when a scout may be off / unavailable 
    var isReady = function(){
      return !z.isReady && (z.data.available && z.data.available.available) && z.data.digital && z.data.analog;
    };

    z.emit('connect');

    z.sync.on('data',function(data){
      // i care about 3 api events
      //
      // available: {"scout":1,"available":1,"reply":"11\n","_t":1399594464252,"type":"available"}
      // digital:   {"type":"digital","mode":[-1,-1,-1,-1,2,-1,-1],"state":[-1,-1,-1,-1,0,-1,-1],"_t":1396672122237}
      // analog:    {"type":"analog","mode":[-1,-1,-1,-1,-1,-1,-1,-1],"state":[-1,-1,-1,-1,-1,-1,-1,-1],"_t":1396651237836}
      //
      data = data.data;
      
      if(data.account && data.troop == z.troop && data.scout == z.scout && data.type) {

        var key = data.type
        z.data[key] = data.value||data;
        
        if(key == 'digital' || key == 'analog') {
          var offset = key == 'analog'?9:2;
          var report = data.value;
          var skew = key == 'digital'?2:0;

          report.mode.forEach(function(mode,i){
            
            var value = report.state[i];
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

            if(z.isReady && change) {
              z.emit(key+'-pin-'+(i+offset));
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

  z.pins = pins.map(function(pin,i) {
    return {
      id:pin.id,
      supportedModes: pin.modes,
      mode: -1, // disabled. waiting for push from api.
      value: 0,
      report:1,// all pins report
      analogChannel:i>=9?i-9:127
    };  
  }); 

  this.analogPins = this.pins.slice(9).map(function(pin, i) {
    return i+9;
  }); 

}

util.inherits(PinoccioIO.prototype,Emitter);
PinoccioIO.prototype = new Emitter;

mix(PinoccioIO.prototype,{
  name:"pinoccio-io",
  isReady:false,
  HIGH:1,
  LOW:0,
  MODES:modes,
  pins:[],
  // handle to api.
  _api:false,
  // placeholder for setSamplingInterval
  _interval:19,
  pinMode:function(pin,mode){

    var p = pinType(pin,'digital');

    if(this.pins[p.i].mode === mode) return this;

    this.pins[p.i].mode = mode;

    this.command('pin.setmode("'+p.pin+'",'+mode+')',function(err){
      if(err) console.log('pin setmode error ',p.pin,mode,err);
    });

    return this;
  },
  digitalWrite:function(pin,value){
    var p = pinType(pin,'digital');
    return this._pinWrite(p,value);
  },
  analogWrite:function(pin,value){
    var p = pinType(pin,'analog');
    // based on http://arduino.cc/en/Reference/AnalogWrite shouldn't the pin default to digital?
    // just copying the default behavior from spark-io. TODO check j5 examples
    return this._pinWrite(p,value);
  },
  digitalRead:function(pin,handler){
    var p = pinType(pin,'digital');
    return this._pinRead(p,handler);
  },
  analogRead:function(pin,handler){
    var p = pinType(pin,'analog');
    return this._pinRead(p,handler);
  },
  setSamplingInterval:function(analogInterval,digitalInterval,peripheralInterval,cb) {
    // this sets the analog sampling interval.
    // right now it also resets the digital and peripheral sampling intervals.
    analogInterval = safeInt(analogInterval||1000);
    digitalInterval = safeInt(digitalInterval||50,50);
    peripheralInterval = safeInt(peripheralInterval||60000);

    // polling reporting interval.
    // events.setCycle(digtialEvents (default is 50ms),analogEvents (default is 1000ms),peripheral sampling interval (temp battery etc default 60000ms))
    var z = this;
    z.command("events.setCycle("+digitalInterval+","+analogInterval+","+peripheralInterval+");",function(err,data){
      if(err) z.emit('command-error',err)
      if(cb) cb(err,data);
      else console.error('error setting sampling interval. ',err);
    });

    return this;
  },
  reset:function() {
    // whats this supposed to do.
    return this;
  },
  close:function() {
    if(this.sync) this.sync.end();
    // it seems like i should do these things
    //this.isReady = false;
    //this.emit('close');
  },
  _pinWrite:function(data,value){

    value = +value;
    if(isNaN(value)) return false;
    this.command('pin.write("'+data.pin+'",'+value+')',function(err,data){
      if(err) console.error('error writing pin ',data,value,err);
    }); 
      
  },
  _pinRead:function(data,handler){
    // expect pin as string
    console.log('adding event handler',data.name+'-pin-'+data.i);
    this.on(data.name+'-pin-'+data.i,handler);
    return this;
  },
  // pinoccio only.
  // send scout script command directly to the scout.
  command:function(command,cb){
    var z = this;
    z._api.rest({url:'/v1/'+this.troop+'/'+this.scout+'/command',data:{command:command}},function(err,data){
      cb(err,data);
    });
  },
});

PinoccioIO.prototype.servoWrite = PinoccioIO.prototype.analogWrite;

function safeInt(interval,min,max){
  min = min||100;
  max = max||65535;
  return interval < min ?
    min : (interval > max ? max : interval);
}

function pinType(pin,type){
  var t = type == 'analog'?'a':'d';
  if(typeof pin == 'number'){
    if(pin >= 9){
      t = 'a';
      pin -= 9;
    }
    pin = t+pin;
  }

  pinInt = (pin.replace(/A|D/i, "") | 0) + (t == 'a' ? 9 : 0);

  return {pin:pin.toLowerCase(),type:t,name:type,i:pinInt};
}


function mix(o1,o2){
  for(var i in o2){
    if(o2.hasOwnProperty(i)) o1[i] = o2[i];
  }
}
