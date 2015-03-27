var bus = require('../src/catbus.js');

var sensor = function(msg) { console.log(msg); };
var beeper = function(msg) { console.log('beeper: mouse now in ' + msg); };
var speaker = function(msg){ console.log('speaker: mouse last detected in ' + msg); };
var isMouse = function(msg){ return msg === 'scurry'; };
var toTag = function(msg, topic, tag) { return tag; };

var alarm = bus.at('alarm');
var kitchen = bus.at('kitchen');
var hall = bus.at('hall');
var den = bus.at('den');
var tracker = bus.at('tracker');

alarm.on().batch().keep('last').run(speaker).host('test');
tracker.on('update').filter(isMouse).transform(toTag).pipe(alarm).host('test');
tracker.on('update').filter(isMouse).transform(toTag).run(beeper).host('test');
tracker.on('update').batch().group().keep('all').run(sensor).host('test');

kitchen.on().pipe(tracker).host('test');
hall.on().pipe(tracker).host('test');
den.on().pipe(tracker).host('test');

den.write('bounce');
den.write('skip');
kitchen.write('scurry');
hall.write('scurry');
hall.write('flip');

bus.flush();

bus.dropHost('test');

