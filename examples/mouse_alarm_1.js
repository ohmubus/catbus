var catbus = require('../src/catbus.js');

var sounds = ['squeak','growl','meow','woof'];
var room_names = ['kitchen','hall','den','bathroom'];

var rooms = catbus.at(room_names);



function makeRandomNoisesAllOver(num){

    function getRandomItem(list){ return list[Math.floor(Math.random()*list.length)]; }

    for(var i = 0; i < num; i++){
        var room_name = getRandomItem(room_names);
        var room = catbus.at(room_name);
        var sound = getRandomItem(sounds);
        room.write(sound);
    }
}


var beeper = function(msg, topic, tag) { console.log('Mouse now in ' + tag); };
var isMouse = function(msg){ return msg === 'squeak'; };

rooms.on('update').filter(isMouse).run(beeper);


makeRandomNoisesAllOver(20);

catbus.flush();


