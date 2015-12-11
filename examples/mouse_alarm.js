var bus = require('../src/catbus.js');

var logger = function(msg) { console.log(msg); };
var beeper = function(msg, topic, tag) { console.log('beeper: mouse now in ' + tag); };
var speaker = function(msg) {
    console.log('speaker: mouse last detected in: ' + msg);
};
var barfer = function(msg, topic){
    console.log('barf:',msg,topic);
};

var isMouse = function(msg){ return msg === 'squeak'; };
var toInfo = function(msg, topic, tag) {
    return {sound: msg, from: tag};
};

var sounds = ['squeak','growl','meow','woof'];
var room_names = ['kitchen','hall','den','bathroom'];
var rooms = bus.location(room_names);

var zoo = bus.location('zoo');



function getRandomItem(list){ return list[Math.floor(Math.random()*list.length)]; }

//var s2 = bus.location('kitchen').sensor().run(function(msg, topic, tag){ console.log(msg + ' in the Kitchen!' + ":"+topic+":"+tag);});

var s1 = rooms.sensor().filter(isMouse).transform(toInfo).merge().keep('last').batch().extract('from').run(speaker);
rooms.sensor().filter(isMouse).run(beeper);
rooms.sensor().merge().group().keep('all').batch().run(logger);
zoo.on('*').batch().group(function(msg, topic){return topic;}).run(barfer);

//console.log('zone:',s2.attr('zone'));

for(var i = 0; i < 20; i++){
    var room_name = getRandomItem(room_names);
    var room = bus.location(room_name);
    var sound = getRandomItem(sounds);
    room.write(sound);
    zoo.write(i, sound);
}
//console.log('rooms:', rooms);

bus.flush();

bus.dropHost('test');

