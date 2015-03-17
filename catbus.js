
;(function (root, factory) {
    if(typeof define === "function" && define.amd) {
        define(factory);
    } else if(typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.catbus = factory();
    }
}(this, (function(){

    var catbus = {};

    var createQueueFrame = function(){
        return  {defer:[], batch:[], batchAndDefer:[]};
    };

    catbus.uid = 0;
    catbus._locations = {};
    catbus._hosts = {};
    catbus._primed = false;
    catbus._queueFrame = createQueueFrame();

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

    catbus.at = function(name, tag) {
        var locs = catbus._locations;
        return locs[name] || (locs[name] = new Location(name, tag));
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


    var Sensor = function(cluster) {

        this._cluster = cluster;
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
        this._keep = 'last'; // last or first or all
        this._pipe = false;
        this._needs = []; // array of tags needed before firing
        this._retain = false; // will retain prior tag messages
        this._last = null;
        this._name = null;
        this._postcard = null; // wrapped msg about to be sent...
        this._sleeping = false;
        this._id = ++catbus.uid;

        cluster._add(this);
    };

    Sensor.prototype.name = function(name){
      if(arguments.length === 0) return this._name;
        this._name = name;
        return this;
    };

    Sensor.prototype.data = function(data){
        if(arguments.length === 0) return this._data;
        this._data = data;
        return this;
    };

    Sensor.prototype.needs = function(tags){
        if(arguments.length === 0) return this._needs;
        this._needs = tags;
        return this;
    };

    Sensor.prototype.location = function(){
        return this._cluster && this._cluster._location;
    };

    Sensor.prototype.tag = function(){
        var loc = this.location();
        return loc && loc.tag();
    };

    Sensor.prototype.host = function(name) {

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

    Sensor.prototype.on = function(topic){

        var origCluster  = this._cluster;
        var location = origCluster._location;
        var origTopic = origCluster._topic;

        if(arguments.length === 0) return origTopic;

        if(origCluster) // changing clusters with locations, leave the current one
            origCluster._remove(this);
        var newCluster = this._cluster = location._demandCluster(topic);
        newCluster._add(this);
        return this;
    };

    Sensor.prototype.topic = function() {
        return this._cluster && this._cluster._topic;
    };

    Sensor.prototype.peek = function() {
        return this._cluster && this._cluster._lastEnvelope;
    };

    Sensor.prototype.sleep = function() {
        this._sleeping = true;
        return this;
    };

    Sensor.prototype.wake = function() {
        this._sleeping = false;
        return this;
    };

    Sensor.prototype.active = function(state){
        if(arguments.length === 0) return !this._sleeping;
        this._sleeping = !state;
        return this;
    };

    Sensor.prototype.look = Sensor.prototype.read = function() {
        var packet = this.peek();
        return (packet) ? packet.msg : undefined;
    };

    Sensor.prototype.auto = Sensor.prototype.autorun = function() {
        var packet = this.peek();
        if(packet && packet.msg != undefined)
            this.tell(packet.msg, packet.topic);
        return this;
    };

    Sensor.prototype.at = Sensor.prototype.watch = function(location){

        if(arguments.length === 0) return this._cluster._location;

        var locations = catbus._locations;
        if(typeof location === 'string'){
            var newLocation = locations[location];
            if(!newLocation)
                throw new Error("Sensor in unresolved location: " + location);
            location = newLocation;
        }

        if(location === this._cluster._location) return this;

        var origCluster  = this._cluster;
        var origTopic = origCluster._topic;

        if(origCluster) // changing clusters with locations, leave the current one
            origCluster._remove(this);

        var newCluster = this._cluster = location._demandCluster(origTopic);
        newCluster._add(this);
        return this;
    };

    Sensor.prototype.pipe = function(location){
        this._pipe = location;
        return this;
    };

    Sensor.prototype.retain = function(){
        this._retain = true;
        return this;
    };

    Sensor.prototype.filter = function(filterFunc){
        if(typeof filterFunc !== 'function')
            throw new Error("Sensor filter must be a function");
        this._filter = filterFunc;
        return this;
    };

    Sensor.prototype.run = function(callback){
        this._callback = callback;
        return this;
    };

    Sensor.prototype.as = function(context){
        this._context = context;
        return this;
    };

    Sensor.prototype.drop = function(){
        if(!this._cluster){
            return;
        }
        this.host(null);
        this._cluster._remove(this);
        this._cluster = null;
        return this;
    };

    Sensor.prototype.max = function(n){
        this._max = n;
        return this;
    };

    Sensor.prototype.batch = function(){
        this._batch = true;
        return this;
    };

    Sensor.prototype.keep = function(val){ // last, first or all
        if(arguments.length === 0)
            return this._keep;
        this._keep = val;
        return this;
    };



    Sensor.prototype.defer = function(){
        this._defer = true;
        return this;
    };

    Sensor.prototype.once = function(){
        this._max = 1;
        return this;
    };

    Sensor.prototype.change = Sensor.prototype.distinct = function(){
        this._change = true;
        return this;
    };

    Sensor.prototype.group = function(){
        this._group = true;
        this._batch = true;
        return this;
    };

    Sensor.prototype.transform = function(transformMethod){
        this._transformMethod = transformMethod;
        return this;
    };

    Sensor.prototype.tell = function(msg, topic, tag) {

        if(this._sleeping)
            return this;

        if(!this._callback && !this._pipe)
            return this; // no actions to take

        if(this._filter && !this._filter(msg, topic, tag))
            return this; // message filtered out

        msg = (this._transformMethod) ? this._transformMethod.call(this._context || this, msg, topic, tag) : msg;

        if (this._batch) { // create lists of messages grouped by tag and list in order
            var list = this._batchedByTag[tag] = this._batchedByTag[tag] || [];
            list.push(msg);
            this._batchedAsList.push(msg);
        } else {
            this._postcard = catbus.envelope(msg, topic, tag, this);
        }

        if(this._primed) return;

        // if all needs are not met, don't prime to send
        if(this._batch && this._needs) {
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
        this._postcard = catbus.envelope(consolidated, 'update', this.tag(), this);

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

        this._postcard = catbus.envelope(msg, 'update', this.tag(), this);

    };


    Sensor.prototype.send = function() {

        if(!this._cluster)
            return this; // dropped while batching?

        if(this._batch && this._group) {
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

        if(!this._batch && this._change && this._last && this._last.msg === postcard.msg) {
                return this;
        }

        this._last = postcard;

        if(this._pipe){
            if(this._group){
                for(var tag in postcard.msg){
                    var tag_msg = postcard.msg[tag];
                    this._pipe.tell(tag_msg, postcard.topic, tag);
                }
            } else {
                this._pipe.tell(postcard.msg, postcard.topic, this.tag());
            }
        } else {
            if(typeof (this._callback) !== 'function') return this;
            this._callback.call(this._context || this, postcard.msg, postcard.topic, this.tag());
        }

        if(this._max > 0)
            this._max--;
        if(this._max == 0)
            this.drop();

        return this;

    };

    var Location = function(name, tag) {

        this._id = ++catbus.uid;
        this._tag = tag || name;
        this._name = name;
        this._clusters = {}; // by topic

        this._demandCluster('update'); // default for data storage

    };

    Location.prototype.toString = function() {
        return "[Location]: " + this._name;
    };

    Location.prototype.tag = function(){
        return this._tag || null;
    };

    Location.prototype.name = function(){
        return this._name || null;
    };

    Location.prototype.on = function(topic){

        topic = topic || "update";
        if(typeof topic !== 'string')
            throw new Error("Topic is not a string");

        var cluster = this._demandCluster(topic);
        return new Sensor(cluster);

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

        this._demandCluster(topic);

        for(var t in this._clusters){
            if(catbus.matchTopics(t,topic)){
                var cluster = this._clusters[t];
                cluster._tell(msg, topic, tag);
            }
        }
    };

    Location.prototype.refresh = function(topic){
        this.write(this.read(topic),topic);
    };

    Location.prototype.toggle = function(topic){
        this.write(!this.read(topic),topic);
    };

    return catbus;

})));