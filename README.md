# Catbus
Data Store (Cat?) and Message Bus (Bus!) in Javascript

# This README is hella out of date, so consider it a WIP.

## Overview

Designed as a standalone Javascript library, Catbus provides a pub/sub implementation that supports data storage and functional transformations, simplifying the coordination of asynchronous processes and states. Batch, group, filter, pipe, etc. Manage subscriptions en masse in order to avoid memory leaks or unexpected behaviors.

## Usage

```javascript

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

bus.at('kitchen').sense().run(function(msg, topic, tag){ console.log(msg + ' in the Kitchen!' + ":"+topic+":"+tag);});

rooms.sense().filter(isMouse).transform(toInfo).merge().keep('last').batch().run(speaker);
rooms.sense().filter(isMouse).run(beeper);
rooms.sense().merge().group().keep('all').batch().run(logger);

for(var i = 0; i < 20; i++){
    var room_name = getRandomItem(room_names);
    var room = bus.at(room_name);
    var sound = getRandomItem(sounds);
    room.write(sound);
}

bus.flush();

bus.dropHost('test');


```

## API Documentation

### Bus Methods 

|Name | Parameters | Description | Returns | 
|-----|------------|-------------|---------|
|at, location | name: string, (optional) tag: string | Creates or retrieves a Location with the given name stored on the bus. A tag can be given to the Location; this will travel with any messages generated at the Location. The tag is the same as the name by default. | Location | 
|dropHost | name: string | Drops (i.e. destroys) any Sensors or Locations with the host name provided. | boolean (host existed?) | 
|flush | none | Triggers the processing of all pending messages on the bus. This is called automatically | self | 

### Location Methods 

|Name | Parameters | Description | Returns | 
|-----|------------|-------------|---------|
|on, topic | (optional) topic: string | Creates a Sensor watching this Location for messages associated with the given topic. The default topic is 'update'. | Sensor | 
|peek | (optional) topic: string | Returns the metadata associated with the last message written to the Location for the given topic (default: 'update'). | message metadata | 
|read | (optional) topic: string | Returns the last message written to the Location for the given topic (default: 'update'). | msg: * | 
|write | msg: *, (optional) topic: string, (optional) tag: string | Writes a message to the Location, triggering any Sensors currently watching it under a matching topic (default: 'update'). The default tag is the one associated with the Location.  | self | 
|refresh | (optional) topic: string, (optional) tag: string  | Rewrites the current data at the Location, triggering any interested Sensors (note: the change flag would completely suppress this).  | self | 
|toggle | (optional) topic: string, (optional) tag: string  | Writes the (!current data) at the Location, triggering any interested Sensors. | self | 
|tag | none | Gets the tag of the Location. | tag: string | 
|name | none | Gets the name of the Location. | name: string | 

### Sensor Attributes

These 'attributes' are all chainable setter methods; they are listed separately because all of these can be accessed via the attr method: sensor.attr(name, value) or sensor.attr({name: value, ... }). It acts as a getter if there is no value argument provided. 

|Name | Parameter | Description | Setter Default | Sensor Default | 
|-----|------------|-----------------------------------------|---------|---------|
|at, location | location: string or Location | Assigns a new Location to the Sensor (thus no longer watching a prior Location).  | current Location | original Location | 
|on, topic | topic: string | Assigns a new topic to the Sensor (thus no longer following a prior topic). | 'update' | 'update' |
|name | name: string | Assigns a name to the Sensor. | null | null | 
|run | callback: function |  Sets a callback to be invoked by the Sensor when triggered. Can run in specified context attribute. | null | null |
|filter | handler: function |  Sets a function to silently filter messages in the Sensor so they do not trigger or accumulate. The handler will receive (msg, topic, tag) and should return true to continue processing the message. Can run in specified context attribute. | null | null |
|transform | handler: function |  Sets a function to transform messages (if not filtered). The handler will receive (msg, topic, tag) and should return a new modified message. Can run in specified context attribute. | null | null |
|pipe | location: string or Location |  Sets a target Location to which the Sensor writes when triggered. | null | null | 
|change | flag: boolean | Prevents a Sensor from triggering unless an incoming value differs from the last value received. | true | false | 
|batch | flag: boolean | Causes a Sensor to accumulate messages as specified by the Sensor's keep attribute -- until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). | true | false | 
|group | flag: boolean | Causes a Sensor to accumulate messages in a hash by tag as specified by the Sensor's keep attribute --  until flushed (via nextTick(), requestAnimationFrame() or by manually invoking bus.flush()). Often used in tandem with batch and/or retain. | true | false | 
| keep | string: 'last', 'first' or 'all' | Causes a Sensor to keep certain messages (only the first, the last or all of them). If the group flag is set, the keep rules will be applied to messages by tag (not by the full set). | 'last' | 'last' |
|defer | flag: boolean | Delays triggering the Sensor until messages without the defer flag have been processed. | true | false |
|retain | flag: boolean | Retains messages even after a flush in order to accumulate a fuller list (batch) or hash (group) | true | false |
|host | name: string | Assigns a new host name to the Sensor. When a host is dropped through bus.dropHost(name), all Sensors and Locations assigned to the host are dropped and/or destroyed.  | null | null | 
|need | tag(s): string or [strings] | Prevents a Sensor from triggering until it has received messages for all specified tags. Generally used with batch, group and/or retain flags. | null | null |
|active | flag: boolean | Enables or disables the Sensor ability to trigger. | true | true |
|max | count: integer | Limits the number of times a Sensor can trigger. When the max is reached, the Sensor will automatically drop(). A value of -1 has no trigger limit. | -1 | -1 |
|as | context: object | Sets the 'this' context that the filter, run and transform functions will use if needed. | self | self |

### Sensor Methods 

|Name | Parameters | Description | Returns | 
|-----|------------|-------------------|---------|
|once | none | Sets the max triggers attribute to 1. | self | 
|wake | none | Sets the active attribute to true. | self | 
|sleep | none | Sets the active attribute to false. | self | 
|peek | none | Returns the packet containing the Sensor's last incoming msg and metadata (not filtered or transformed). | msg metadata | 
|read | msg: * | Returns the Sensor's last incoming msg (not filtered or transformed). | self | 
|tell | msg: *, topic: string, tag: string | Writes a message to the Sensor. This should generally only be called by Location objects -- but is exposed for hacking or debugging. | self | 
|drop | none | Drops the Sensor's subscription to a Location, effectively destroying it. | self |
|attr | name: string | Gets the value of the given attribute.  | attribute value: * |
|attr | name: string, value: * | Sets the value of the given attribute.  | self |
|attr | {name: value, ... } | Sets multiple attribute values on the Sensor.  | self |




