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



var beeper = function(msg) { console.log('Sounds by room:\n ', msg); };
rooms.on('update').merge().group().keep('all').batch().run(beeper);

makeRandomNoisesAllOver(15);

catbus.flush();


