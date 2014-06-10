var test = require('tape');
var Pinoccio = require('../');

test("can use board",function(t){

  var board = new Pinoccio({
    token: "71933a35bd8fa564be3096bcdb815061", // todo integrate other tokens.
    troop:2,
    scout:1,
    api:'https://localhost:8003'
  });

  board.on("ready", function() {

    var z = this;

    this.pinMode("D5", this.MODES.OUTPUT);

    var byte = 0;

    this.digitalWrite("D5", (byte ^= 1));
    setTimeout(function(){
      this.digitalWrite("D5", (byte ^= 1));
    }.bind(this),500)

    var c = 0;

    this.digitalRead("D5",function(){

      if(++c === 1) t.ok(z.pins[5].value,0,'detects off');
      else t.ok(z.pins[5].value,1,'detects on');

      if(c == 2) t.end();

    });

  }).on('error',function(err){
    t.error(err,'should not have error');
  });

});



