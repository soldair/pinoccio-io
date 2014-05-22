var test = require('tape');
var Pinoccio = require('./');
var five = require('johnny-five')

console.log('hi');

var board = new five.Board({
  io: Pinoccio({
    token: "71933a35bd8fa564be3096bcdb815061", // todo integrate other tokens.
    troop:2,
    scout:1,
    api:'https://localhost:8003'
  })
});

board.on("ready", function() {
  console.log('ready!');
  var led = new five.Led();
  led.blink(200);
});




