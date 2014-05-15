pinoccio-io
===========

johnny five io plugin for pinoccio!

[![Build Status](https://pinocc.io/images/pinoccio-logo-mini.png)](https://pinocc.io)

thanks to @rwaldron for johnny-five and io plugins which served as example.

to find out about https://pinocc.io 
 

### Blink an Led

The "Hello World" of microcontroller programming: 

```js
var Pinoccio = require("pinoccio-io");
var board = new Pinoccio({
  token: "{{yours}}",
  troop: "{{yours}}",
  scout: "{{yours}}"
});

board.on("ready", function() {
  console.log("CONNECTED");
  this.pinMode("D5", this.MODES.OUTPUT);

  var byte = 0;

  setInterval(function() {
    console.log("message");
    this.digitalWrite("D5", (byte ^= 1));
  }.bind(this), 500);
});
```

### Johnny-Five IO Plugin

pinoccio-io can be used as an [IO Plugin](https://github.com/rwaldron/johnny-five/wiki/IO-Plugins) for [Johnny-Five](https://github.com/rwaldron/johnny-five):

```js
var five = require("johnny-five");
var Pinoccio = require("pinoccio-io");
var board = new five.Board({
  io: new Pinoccio({
    token: "{{yours}}",
    troop: "{{yours}}",
    scout: "{{yours}}"   
  })
});

board.on("ready", function() {
  var led = new five.Led("D5");
  led.blink(500);
});
```

API
---

todo. =) 

- pinMode
- digitalWrite
- analogWrite
- digitalRead
- analogRead
- setSamplingInterval




