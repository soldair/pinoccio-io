var Pinoccio = require('../'),
    five = require('johnny-five');
 
var board = new five.Board({
  io: new Pinoccio({
    api:'https://localhost:8003',
    token: '2067ffafe3b7b815a13bd9f64bb71b92',
    troop: '4',
    scout: '2'
  }).on('error',function(err){
    console.log('error> ',err);
  })
});
 
board.on('ready', function () {
  console.log('READY!')
  var button = new five.Button({pin:"D4",invert:true});
 
  button.on('down', function () {
    console.log('down!!');
  });
});
