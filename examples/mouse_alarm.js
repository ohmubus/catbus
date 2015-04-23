var bus = require('../src/catbus.js');

var logger = function(msg) { console.log(msg); };
var beeper = function(msg, topic, tag) { console.log('beeper: mouse now in ' + tag); };
var speaker = function(msg) { console.log('speaker: mouse last detected in: ' + msg.from); };

var isMouse = function(msg){ return msg === 'squeak'; };
var toInfo = function(msg, topic, tag) { return {sound: msg, from: tag}; };

var sounds = ['squeak','growl','meow','woof'];
var room_names = ['kitchen','hall','den','bathroom'];
var rooms = bus.at(room_names);

function getRandomItem(list){ return list[Math.floor(Math.random()*list.length)]; }

// add merge to sensor
// add tag to sensor and location
// add split to sensor
// add adapt to sensor

rooms.sense().filter(isMouse).transform(toInfo).merge().keep('last').batch().run(speaker);
rooms.sense().filter(isMouse).run(beeper);
rooms.sense().merge().group().keep('all').batch().run(logger);

for(var i = 0; i < 20; i++){
    var room = bus.at(getRandomItem(room_names));
    room.write(getRandomItem(sounds));
}

bus.flush();

bus.dropHost('test');

