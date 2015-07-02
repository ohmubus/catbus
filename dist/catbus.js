/**
 * catbus.js (v1.1.0)
 *
 * Copyright (c) 2015 Scott Southworth, Landon Barnickle & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @authors Scott Southworth @DarkMarmot, Landon Barnickle @landonb
 *
 */

;(function(){

    var catbus = {};

    function createQueueFrame() {
        return  {defer:[], batch:[], batchAndDefer:[]};
    }

    function demandLocation(name){
        var locs = catbus._locations;
        return locs[name] || (locs[name] = new Location(name));
    }

    function createSensor(topic, loc){
        return new Sensor(topic, loc);
    }

    function createFunctor(val) {
        return (typeof val === 'function') ? val : function() { return val; };
    }


    catbus.uid = 0;
    catbus._locations = {};
    catbus._hosts = {};
    catbus._primed = false;
    catbus._queueFrame = createQueueFrame();

    catbus.sense = function(topic){
        return createSensor(topic);
    };

    catbus.dropHost = function(name){

        var hosts = catbus._hosts;
        if(!hosts[name]) return false;
        var host = hosts[name];
        var n = 0;
        for(var id in host._sensorMap){
            var sensor = host._sensorMap[id];
            sensor.drop();
            n++;
        }

        delete hosts[name];
    };

    catbus.at = catbus.location = function(nameOrNames) {

        if(typeof nameOrNames === 'string')
            return demandLocation(nameOrNames);

        if(nameOrNames.length === 1)
            return demandLocation(nameOrNames[0]);

        // assume array for now todo use config type checking
        var multiLoc = demandLocation('auto:' + (catbus.uid + 1));
        var locs = multiLoc._multi = [];
        for(var i = 0; i < nameOrNames.length; i++){
            var name = nameOrNames[i];
            locs.push(demandLocation(name));
        }
        return multiLoc;

    };


    catbus.matchTopics = function(sensorTopic, locationTopic){

        return sensorTopic === "*" || sensorTopic === locationTopic;
    };

    catbus.envelope = function(msg, topic, tag, owner){

        return {
            prior: (owner) ? owner._last : null,
            msg: msg,
            topic: topic,
            tag: tag,
            owner: owner,
            id: ++catbus.uid,
            sent: Date.now()
        }

    };

    catbus.queue = function(sensor) {

        var arr;
        var q = this._queueFrame;
        if(sensor._defer) {
            if (sensor._batch) {
                arr = q.batchAndDefer;
            } else {
                arr = q.defer;
            }
        } else {
            arr = q.batch;
        }
        arr.push(sensor);

        if (this._primed) return;
        this._primed = true;

        if(typeof window !== 'undefined' && window.requestAnimationFrame) requestAnimationFrame(this.flush.bind(this));
        else process.nextTick(this.flush.bind(this));

    };

    catbus._processTellArray = function(arr){

        while(arr.length){
            var sensor = arr.shift();
            sensor.send();
        }

    };



    catbus.flush = function(){

        this._primed = false;

        // todo add max loop depth to avoid infinite message doom
        while(this.hasQueuedMessages()) {

            var q = this._queueFrame;
            this._queueFrame = createQueueFrame();

            this._processTellArray(q.defer);
            this._processTellArray(q.batch);
            this._processTellArray(q.batchAndDefer);

        }

    };

    catbus.hasQueuedMessages = function(){

        var q = this._queueFrame;
        return q.defer.length || q.batch.length || q.batchAndDefer.length;

    };


    var Cluster = function(topic, location) {
        this._location = location;
        this._topic = topic;
        this._sensors = [];
        this._lastEnvelope = null;
    };

    Cluster.prototype._add = function(sensor){
        this._sensors.push(sensor);
    };

    Cluster.prototype._remove = function(sensor){
        var i = this._sensors.indexOf(sensor);
        if(i == -1) return;
        this._sensors.splice(i,1);
    };

    Cluster.prototype._tell = function(msg, topic, tag){
        this._lastEnvelope = catbus.envelope(msg, topic, tag, this); // message stored enveloped before sending and transforming
        var sensors = [].concat(this._sensors);
        for(var i = 0; i < sensors.length; i++){
            var sensor = sensors[i];
            sensor.tell(msg, topic, tag);
        }
    };

    var Host = function(name){
        this._name = name;
        this._sensorMap = {};
        this._locationMap = {};
    };


    var Sensor = function(topic, loc) {

        topic = topic || 'update'; // change default to *?

        this._multi = null; // list of sensors to process through sensor api
        this._callback = null;
        this._context = null;
        this._max = null;
        this._host = null;
        this._bus = catbus;
        this._defer = false;
        this._batch = false;
        this._group = false;
        this._batchedByTag = {};
        this._batchedAsList = [];
        this._keep = null; // last or first or all or null (not batching)
        this._pipe = false;
        this._needs = []; // array of tags needed before firing
        this._retain = false; // will retain prior tag messages
        this._last = null;
        this._name = null;
        this._postcard = null; // wrapped msg about to be sent...
        this._active = true;
        this._id = ++catbus.uid;
        this._appear = null;
        this._lastAppearingMsg = undefined;
        this._dropped = false;
        this._locked = false;
        this._mergeLoc = null; // an autogenerated Location to hold merged data
        this._cluster = loc ? loc._demandCluster(topic) : null;
        if(this._cluster)
            this._cluster._add(this);

    };


    Sensor.prototype.throwError = function(msg){
        throw {error:"Catbus: Sensor", msg: msg, sensor: this};
    };


    var bus_config = {

    };

    var location_config = {

        on: {name: 'on', alias: ['topic','sensor'], type: 'string' , setter: '_setTopic', getter: '_getTopic'},
        tag: {name: 'tag', type: 'string' , prop: '_tag'}

    };

    var sensor_config = {

        keep: {name: 'keep', options: ['last', 'first', 'all'], prop: '_keep', default_set: 'last'},
        retain: {name: 'retain', type: 'boolean', prop: '_retain', default_set: true},
        need: {name: 'need', transform: '_toStringArray', valid: '_isStringArray', prop: '_needs'}, // todo, also accept [locs] to tags
        host:  {name: 'host', transform: '_toString', type: 'string', setter: '_setHost', prop: '_host'},
        defer: {name: 'defer', type: 'boolean' , prop: '_defer', default_set: true},
        batch: {name: 'batch', type: 'boolean' , prop: '_batch', default_set: true, setter: '_setBatch'},
        change: {name: 'change', type: 'boolean' , prop: '_change', default_set: true},
        group: {name: 'group', type: 'boolean' , prop: '_group', default_set: true, setter: '_setGroup'},
        pipe: {name: 'pipe', valid: '_isLocation', prop: '_pipe'},
        name: {name: 'name', type: 'string' , prop: '_name'},
        active: {name: 'active', type: 'boolean' , prop: '_active', default_set: true},
        sleep: {name: 'sleep', no_arg: true , prop: '_active', default_set: false},
        wake: {name: 'wake', no_arg: true , prop: '_active', default_set: true},
        on: {name: 'on', alias: ['topic','sense'], type: 'string' , setter: '_setTopic', getter: '_getTopic'},
        watch:  {name: 'watch', alias: ['location','at'], transform: '_toLocation', valid: '_isLocation', setter: '_setLocation', getter: '_getLocation'},
        exit:  {name: 'exit', alias: ['transform'], type: 'function', functor: true, prop: '_transformMethod'},
        enter: {name: 'enter', type: 'function', functor: true, prop:'_appear'},
        run: {name: 'run', type: 'function' , prop: '_callback'},
        filter: {name: 'filter', type: 'function' , prop: '_filter'},
        as: {name: 'as', type: 'object' , prop: '_context'},
        max:  {name: 'max', transform: '_toInt', type: 'number' , prop: '_max'},
        once:  {name: 'once', no_arg: true, prop: '_max', default_set: 1},
        tag: {name: 'tag', getter: '_getTag', prop: '_tag', type: 'string'}

    };

    // build chaining setters from config

    var c;
    var config;

    for(c in sensor_config){
        config = sensor_config[c];
        var alias = config.alias;
        if(alias){
            for(var i = 0; i < alias.length; i++){
                var alias_name = alias[i];
                sensor_config[alias_name] = config;
            }
        }
    }

    for(c in sensor_config){

        config = sensor_config[c];

        if(config.no_write)
            continue;

        (function(name){

            Sensor.prototype[name] = function(value){

                if(this._multi){
                    if(arguments.length === 0)
                        if(config.hasOwnProperty('default_set'))
                            return this._setMultiAttr(name, config.default_set);
                        else
                            return this._setMultiAttr(name);
                    else
                        return this._setMultiAttr(name, value);
                }

                if(arguments.length === 0)
                    if(config.hasOwnProperty('default_set'))
                        return this._setAttr(name, config.default_set);
                    else
                        return this._setAttr(name);
                else
                    return this._setAttr(name, value);
            };

        })(c);

    }

    Sensor.prototype._toInt = function(num){
        return Math.floor(num);
    };

    Sensor.prototype._getTopic = function(){
        return this._cluster && this._cluster._topic;
    };

    Sensor.prototype._getTag = function(){
        if(this._tag)
            return this._tag;
        var loc = this._getLocation();
        return loc && loc.tag();
    };

    Sensor.prototype._getLocation = function(){
        return this._cluster && this._cluster._location;
    };

    Sensor.prototype._toLocation = function(nameOrLocation){
        return (typeof nameOrLocation === 'string') ? demandLocation(nameOrLocation) : nameOrLocation;
    };

    Sensor.prototype._isLocation = function(location){
        return location instanceof Location;
    };

    Sensor.prototype._toStringArray = function(stringOrStringArray){
        var arr;
        if(typeof stringOrStringArray === 'string')
            arr = stringOrStringArray.split(',');
        else
            arr = stringOrStringArray;

        for(var i = 0; i > arr.length; i++){
            arr[i] = (arr[i]).trim();
        }
        return arr;
    };

    Sensor.prototype._toString = function(value){
        if(!value) return null;
        return value + '';
    };

    Sensor.prototype._isStringArray = function(value){
        if(!(value instanceof Array))
            return false;
        for(var i = 0; i < value.length; i++){
            var s = value[i];
            if(typeof s !== 'string')
                return false;
        }
        return true;
    };

    Sensor.prototype.attr = function(nameOrConfig, value){

        if(this._multi){
            return this._multiAttr.apply(this, arguments);
        }

        if(arguments.length === 1){
            if(typeof nameOrConfig === 'string')
                return this._getAttr(nameOrConfig);
            else
                return this._setHashAttr(nameOrConfig);
        } else {
            return this._setAttr(nameOrConfig, value);
        }

    };

    Sensor.prototype._setMultiAttr = function(nameOrConfig, value){

        var i;
        var c = this._multi.length;
        var s;

        if(arguments.length === 1 && typeof nameOrConfig === 'object') {

            for (i = 0; i < c; i++) {
                s = this._multi[i];
                s._setHashAttr(nameOrConfig);
            }
            return this;

        } else {
            for (i = 0; i < c; i++) {
                s = this._multi[i];
                s._setAttr.apply(s, arguments);
            }
            return this;
        }

    };



    Sensor.prototype._multiAttr = function(nameOrConfig, value){

        var i;
        var result;
        var c = this._multi.length;
        var s;

        if(arguments.length === 1) {
            if (typeof nameOrConfig === 'string') {
                result = [];
                for (i = 0; i < c; i++) {
                    s = this._multi[i];
                    result.push(s._getAttr(nameOrConfig));
                }
                return result;
            } else {
                for (i = 0; i < c; i++) {
                    s = this._multi[i];
                    s._setHashAttr(nameOrConfig);
                }
                return this;
            }
        } else {
            for (i = 0; i < c; i++) {
                s = this._multi[i];
                s._setAttr(nameOrConfig, value);
            }
            return this;
        }

    };



    Sensor.prototype._getAttr = function(name){

        var c = sensor_config[name];
        if(!c)
            this.throwError('Sensor getter attribute [' + name + '] not found');

        return (c.getter) ? (this[c.getter]).call(this) : this[c.prop];

    };

    Sensor.prototype._setAttr = function(name, value){

        var c = sensor_config[name];

        if(!c)
            this.throwError('Sensor attribute [' + name + '] does not exist');

        if(c.method && c.no_arg && arguments.length > 1)
            this.throwError('Sensor method [' + name + '] takes no arguments');

        if(c.no_write)
            this.throwError('Sensor attribute [' + name + '] is read-only');

        if(arguments.length === 1)
            value = c.default_set;

        if(c.transform)
            value = (this[c.transform])(value);

        if(c.valid && !((this[c.valid])(value)))
            this.throwError('Sensor set attribute [' + name + '] value invalid: ' + value);

        if(typeof value !== 'function' && c.functor)
            value = createFunctor(value);

        if(c.type && value && c.type !== typeof value)
            this.throwError('Sensor set attribute [' + name + '] type mismatch: ' + value);

        if(c.options && c.options.indexOf(value) === -1)
            this.throwError('Sensor set attribute [' + name + '] value not among options: ' + value);

        if(c.setter)
            (this[c.setter]).call(this, value);
        else if(c.prop)
            this[c.prop] = value;

        return this;

    };

    Sensor.prototype._setHashAttr = function(config){

        for(var name in config){
            var value = config[name];
            this._setAttr(name, value);
        }

        return this;

    };


    Sensor.prototype._setHost = function(name) {

        var hosts = catbus._hosts;
        if(arguments.length==0) return this._host;
        if(this._host && this._host._name != name){
            delete this._host._sensorMap[this._id];
            if(Object.keys(this._host._sensorMap).length == 0){
                delete hosts[this._host._name];
            }
        }
        if(!name) return this; // sensor removed from host when name is falsey
        this._host = hosts[name] || (hosts[name] = new Host(name));
        this._host._sensorMap[this._id] = this;
        return this;

    };

    Sensor.prototype._setTopic = function(topic){

        var origCluster  = this._cluster;
        var location = origCluster._location;
        var origTopic = origCluster._topic;

        if(origCluster) // changing clusters with locations, leave the current one
            origCluster._remove(this);
        var newCluster = this._cluster = location._demandCluster(topic);
        newCluster._add(this);
        return this;
    };



    Sensor.prototype._setGroup = function(group){

        this._group = group;
        if(group)
            this.batch(true);
        return this;
    };

    Sensor.prototype._setBatch = function(batch){

        this._batch = batch;
        if(batch && !this._keep)
            this._keep = sensor_config.keep.default_set;
        return this;

    };

    Sensor.prototype.peek = function() {
        return this._cluster && this._cluster._lastEnvelope;
    };

    Sensor.prototype.look = Sensor.prototype.read = function() {
        var packet = this.peek();
        return (packet) ? packet.msg : undefined;
    };

    Sensor.prototype.auto = Sensor.prototype.autorun = function() {

        var sensors = this._multi || [this];

        for(var i = 0; i < sensors.length; i++){
            var s = sensors[i];
            var packet = s.peek();
            if(packet && packet.msg != undefined)
                s.tell(packet.msg, packet.topic);
        }

        return this;
    };

    Sensor.prototype._setLocation = function(location){

        if(arguments.length === 0) throw new Error();

        //if(arguments.length === 0) return this._cluster._location;

        var locations = catbus._locations;
        if(typeof location === 'string'){
            var newLocation = locations[location];
            if(!newLocation)
                throw new Error("Sensor in unresolved location: " + location);
            location = newLocation;
        }

        if(location === this._cluster && this._cluster._location) return this;

        var origCluster  = this._cluster;
        var origTopic = origCluster && origCluster._topic || 'update';

        if(origCluster) // changing clusters with locations, leave the current one
            origCluster._remove(this);

        var newCluster = this._cluster = location._demandCluster(origTopic);
        newCluster._add(this);
        return this;
    };

    Sensor.prototype.merge = Sensor.prototype.next =function() {

        var sensors = this._multi || [this];

        var mergeLoc = this._mergeLoc = demandLocation('auto:' + (catbus.uid + 1));
        // todo set mergeloc host and context to sensor host?

        var mergeHost = this._host && this._host._name;
        var mergeContext = this._context;

        for(var i = 0; i < sensors.length; i++){
            var s = sensors[i];
            mergeHost = mergeHost || (s._host && s._host._name);
            mergeContext = mergeContext || s._context;
            s.pipe(mergeLoc);
        }


        //this._multi = null;

        return mergeLoc.sense().host(mergeHost).as(mergeContext);

    };


    Sensor.prototype.drop = function(){

        if(this._dropped)
            return this;

        this._dropped = true;
        this._active = false;
        this.host(null);
        if(this._cluster) {
            this._cluster._remove(this);
            this._cluster = null;
        }

        if(this._mergeLoc)
            this._mergeLoc.destroy();

        return this;

    };



    Sensor.prototype.tell = function(msg, topic, tag) {

        if(!this._active || this._dropped)
            return this;

        msg = (this._appear) ? this._appear.call(this._context || this, msg, topic, tag) : msg;
        if(this._change && this._lastAppearingMsg === msg)
            return this;

        this._lastAppearingMsg = msg;

        // todo add ability for change to be a function hasChanged(msg, last_msg) return true is diff
        // todo functor city

        if(!this._callback && !this._pipe)
            return this; // no actions to take

        if(this._filter && !this._filter.call(this._context || this, msg, topic, tag))
            return this; // message filtered out

        //if(!this._batch) // todo take this restriction away when not framework issue

        if (this._batch || this._group) { // create lists of messages grouped by tag and list in order
            var list = this._batchedByTag[tag] = this._batchedByTag[tag] || [];
            list.push(msg);
            this._batchedAsList.push(msg);
        } else {
            msg = (this._transformMethod) ? this._transformMethod.call(this._context || this, msg, topic, tag) : msg;
            this._postcard = catbus.envelope(msg, topic, tag, this);
        }

        if(this._primed) return;

        // if all needs are not met, don't prime to send
        if((this._batch || this._group) && this._needs) {
            for(var i = 0; i < this._needs.length; i++){
                var need = this._needs[i];
                if(!this._batchedByTag.hasOwnProperty(need)) return; // a need unmet
            }
        }

        this._primed = true;

        if (this._batch || this._defer) {
            this._bus.queue(this);
        } else {
            this.send();
        }

    };


    Sensor.prototype._consolidateBatchByTag = function(){

        var consolidated = {};

        for(var tag in this._batchedByTag){

            var msgs = this._batchedByTag[tag];
            var keep = this._keep;

            if(keep === 'first'){
                consolidated[tag] = msgs[0];
            } else if(keep === 'last') {
                consolidated[tag] = msgs[msgs.length - 1];
            } else if(keep === 'all') {
                consolidated[tag] = msgs;
            }

        }

        if(!this._retain) this._batchedByTag = {};

        var msg = consolidated;
        msg = (this._transformMethod) ? this._transformMethod.call(this._context || this, msg, 'update', this._getTag()) : msg;

        this._postcard = catbus.envelope(msg, 'update', this._getTag(), this);

    };

    Sensor.prototype._consolidateBatchAsList = function(){

        var msg;
        var msgs = this._batchedAsList;
        var keep = this._keep;

        if(keep === 'first'){
            msg = msgs[0];
        } else if(keep === 'last') {
            msg = msgs[msgs.length - 1];
        } else if(keep === 'all') {
            msg = msgs;
        }

        msg = (this._transformMethod) ? this._transformMethod.call(this._context || this, msg, 'update', this._getTag()) : msg;
        this._postcard = catbus.envelope(msg, 'update', this._getTag(), this);

    };


    Sensor.prototype.send = function() {

        if(!this._active || this._dropped)
            return this; // dropped while batching?

        if(this._group) {
            this._consolidateBatchByTag();
        } else if (this._batch) {
            this._consolidateBatchAsList();
        }

        if(!this._retain) {
            this._batchedByTag = {};
            this._batchedAsList = [];
        }

        this._primed = false;

        var postcard = this._postcard;

        //if(!this._batch && !this._group && this._change && this._last && this._last.msg === postcard.msg) {
        //        return this;
        //}

        this._last = postcard;

        if(this._pipe){
            //if(this._group){
            //    for(var tag in postcard.msg){
            //        var tag_msg = postcard.msg[tag];
            //        this._pipe.tell(tag_msg, postcard.topic, tag);
            //    }
            //} else {
            this._pipe.tell(postcard.msg, postcard.topic, this._getTag(), this);
            //}
        } else {
            if(typeof (this._callback) !== 'function') return this;
            this._callback.call(this._context || this, postcard.msg, postcard.topic, this._getTag(), this);
        }

        if(this._max > 0)
            this._max--;
        if(this._max == 0)
            this.drop();

        return this;

    };


    var Location = function(name) {

        this._multi = null; // list of locations to put through api
        this._id = ++catbus.uid;
        this._tag = name; // default
        this._name = name;
        this._clusters = {}; // by topic
        this._appear = null;
        this._demandCluster('update'); // default for data storage

    };

    Location.prototype.destroy = function(){

    };

    Location.prototype.toString = function() {
        return "[Location]: " + this._name;
    };

    Location.prototype.tag = function(tag){
        if(arguments.length === 0) return this._tag;
        this._tag = tag;
        return this;
    };

    Location.prototype.name = function(){
        return this._name || null;
    };

    Location.prototype.transform = function(f){
        this._appear = createFunctor(f);
        return this;
    };


    Location.prototype.on = Location.prototype.topic = Location.prototype.sense =  function(topic){

        var topic_list;
        var loc_list;

        topic = topic || 'update';
        topic_list = (typeof topic === 'string') ? [topic] : topic; // assume array todo verify is array

        loc_list = this._multi || [this];

        if(loc_list.length === 1 && topic_list.length === 1)
            return createSensor(topic_list[0], this);

        var multiSensor = createSensor('update', this);
        var sensors = multiSensor._multi = [];

        for(var i = 0; i < loc_list.length; i++){
            var loc = loc_list[i];
            for(var j = 0; j < topic_list.length; j++){
                var topic_name = topic_list[j];
                sensors.push(createSensor(topic_name, loc));
            }
        }

        return multiSensor;

    };


    Location.prototype._findCluster = function(topic){
        return this._clusters[topic];
    };


    Location.prototype._demandCluster = function(topic){
        if(typeof topic !== 'string'){
            throw new Error("Topic is not a string");
        }
        return this._findCluster(topic) || (this._clusters[topic] = new Cluster(topic, this));
    };

    Location.prototype._destroyCluster = function(topic){
        if(topic === 'update') return; // default topic not disposed
        var cluster = this._findCluster(topic);
        if(!cluster || cluster._sensors.length > 0) return null;
        delete this._clusters[topic];
    };

    Location.prototype.peek = function(topic){
        if(arguments.length == 0)
            topic = 'update';
        var cluster = this._findCluster(topic);
        if(!cluster)
            return undefined;
        return cluster._lastEnvelope;

    };

    Location.prototype.look = Location.prototype.read = function(topic) {
        topic = topic || 'update';
        var packet = this.peek(topic);
        return (packet) ? packet.msg : undefined;
    };

    Location.prototype.tell = Location.prototype.write  = function(msg, topic, tag){

        topic = topic || 'update';
        tag = tag || this.tag();

        // add context code
        msg = (this._appear) ? this._appear.call(this._context || this, msg, topic, tag) : msg;

        this._demandCluster(topic);

        for(var t in this._clusters){
            if(catbus.matchTopics(t,topic)){
                var cluster = this._clusters[t];
                cluster._tell(msg, topic, tag);
            }
        }
    };

    Location.prototype.refresh = function(topic, tag){
        this.write(this.read(topic),topic, tag);
    };

    Location.prototype.toggle = function(topic, tag){
        this.write(!this.read(topic),topic, tag);
    };


    catbus.$ = {};

    catbus.$.sense = function(eventName) {

        var sensor = catbus.sense();

        this.on(eventName, function(event){
            sensor.tell(event, 'update', eventName);
        });

        return sensor;

    };

    var selector = typeof jQuery !== 'undefined' && jQuery !== null ? jQuery : null;
    selector = selector || (typeof Zepto !== 'undefined' && Zepto !== null ? Zepto : null);
    if(selector)
        selector.fn.sense = catbus.$.sense;

    if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
        define([], function() {
            return catbus;
        });
        this.catbus = catbus;
    } else if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
        module.exports = catbus;
        catbus.catbus = catbus;
    } else {
        this.catbus = catbus;
    }

}).call(this);