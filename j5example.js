var test = require('tape');
var Pinoccio = require('./');
var five = require('johnny-five')

var config = JSON.parse(require('fs').readFileSync(process.env.HOME+'/.pinoccio'));

console.log(config);

console.log('hi');

var board = new five.Board({
  io: Pinoccio({
    token: config.token, // todo integrate other tokens.
    troop:2,
    scout:2,
    api:'https://localhost:8003'
  })
});

board.on("ready", function() {
  console.log('ready!');
  var led = new five.Led();
  led.blink(200);
});




