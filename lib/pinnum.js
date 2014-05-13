
module.exports = pinNum;

// https://github.com/Pinoccio/core-pinoccio/blob/master/avr/variants/pinoccio/pins_arduino.h
function pinNum(n){
  if(typeof n !== 'number'){
    var match = (n+'').match(/^([AD])(\d+)$/i)
    if(match) {
      return match[1].toLowerCase()+match[2];
    }
  } else {
    if(n >= 2 && n <= 8) return "D"+n;
    else if(n >= 24 && n <= 31) return 'A'+n;
  }
  return false;
}


