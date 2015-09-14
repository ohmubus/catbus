//run mocha from project root

var util = require('util');
var assert = require('assert');
var bus = require('../src/catbus.js');


var _invoked = 0;
var _msg;
var _topic;
var _tag;
var _context;

var _logger = function(msg, topic, tag){

    console.log("LOG: " + msg + " : " + topic + " : " + tag);

};

var _callback = function(msg, topic, tag){

    _context = this;
    _msg = msg;
    _topic = topic;
    _tag = tag;
    _invoked++;

};

var _script = {
    mehve: 1,
    ohmu: 999
};




var tree, boat, castle, valley, airship, girl, ohmu, yupa, lands;

var _reset = function(){

    _context = undefined;
    _msg = undefined;
    _topic = undefined;
    _tag = undefined;
    _invoked = 0;

   // if(girl) { girl.drop(); girl = null;}

};

castle = bus.location('castle');
valley  = bus.location('valley');
airship  = bus.location('airship');



describe('Catbus', function(){

    before(function(){
        tree = bus.location('tree');
        boat = bus.location('boat').tag('Ponyo');
        lands = bus.location(['tree','boat','desert']);
    });

    describe('Zones', function(){


        it('makes and finds trees', function(){

            var fruitTree = bus.demandTree('fruit');
            var catsTree = bus.demandTree('cats');

            assert.equal(fruitTree === bus.demandTree('fruit'), true);
            assert.equal(catsTree === bus.demandTree('cats'), true);

        });

        it('makes child zones', function(){

            var fruitTree = bus.demandTree('fruit');

            var sour = fruitTree.demandChild('sour');
            var sweet = fruitTree.demandChild('sweet');
            var tart = fruitTree.demandChild('tart');

            assert.equal(sour === fruitTree.demandChild('sour'), true);
            assert.equal(fruitTree.snapshot().children.length, 3);

        });

        it('makes child of child zones', function(){

            var fruitTree = bus.demandTree('fruit');

            var sour = fruitTree.demandChild('sour');
            var sweet = fruitTree.demandChild('sweet');
            var tart = fruitTree.demandChild('tart');

            sour.demandChild('lemon');
            sour.demandChild('lime');

            sweet.demandChild('orange');
            sweet.demandChild('peach');
            sweet.demandChild('apple');
            sweet.demandChild('mango');

            tart.demandChild('apple');


            assert.equal(fruitTree.snapshot().children.length, 3);
            assert.equal(sweet.snapshot().children.length, 4);

        });


        it('finds data up the tree', function(){

            var fruitTree = bus.demandTree('fruit');
            fruitTree.demandLocation('owner').write('Scott');

            var sour = fruitTree.demandChild('sour');
            var sweet = fruitTree.demandChild('sweet');
            var tart = fruitTree.demandChild('tart');

            var mango = sweet.demandChild('mango');
            mango.demandLocation('owner').write('Landon');

            var owner = sour.findData('owner').read(); // owner at fruit level
            assert.equal(owner, 'Scott');

            sweet.demandLocation('owner').write('Lars');
            sour.demandLocation('owner').write('Nick');

            owner = sweet.findData('owner').read();
            assert.equal(owner, 'Lars');

            owner = sour.findData('owner').read();
            assert.equal(owner, 'Nick');

            owner = sour.findData('owner', 'last').read();
            assert.equal(owner, 'Scott');

            owner = tart.findData('owner').read();
            assert.equal(owner, 'Scott');

            owner = mango.findData('owner').read();
            assert.equal(owner, 'Landon');

            owner = mango.findData('owner', 'first').read();
            assert.equal(owner, 'Landon');

            owner = mango.findData('owner', 'local').read();
            assert.equal(owner, 'Landon');

            owner = mango.findData('owner', 'parent').read();
            assert.equal(owner, 'Lars');

            owner = mango.findData('owner', 'outer').read();
            assert.equal(owner, 'Lars');

            owner = mango.findData('owner', 'last').read();
            assert.equal(owner, 'Scott');


        });


    });

    describe('Locations', function(){


        it('makes locations', function(){
            assert.equal('object', typeof tree);
            assert.equal(3, lands._multi.length);
        });

        it('with default tags', function(){
            assert.equal('tree', tree.tag());
        });

        it('and specific tags', function(){
            assert.equal('Ponyo', boat.tag());
        });

        it('can hold data', function(){
            tree.write('Totoro');
            assert.equal('Totoro', tree.read());
        });

        it('can modify data', function(){
            tree.write('Kittenbus');
            assert.equal('Kittenbus', tree.read());
            tree.write('Catbus');
            assert.equal('Catbus', tree.read());
        });

        it('can adapt data', function(){

            tree.adapt('meow');
            tree.write('Kittenbus');
            assert.equal('meow', tree.read());
            tree.write('Catbus');
            assert.equal('meow', tree.read());
        });

        it('can adapt data dynamically with topics', function(){

            tree.adapt(function(msg, topic, tag){ return msg + ':' + topic + ':' + tag});
            tree.write('Kittenbus','look','kitten');
            assert.equal('Kittenbus:look:kitten', tree.read('look'));
            tree.write('Catbus');
            assert.equal('Catbus:update:tree', tree.read());

        });

        it('can clear adapt', function(){

            tree.adapt();
            tree.write('Kittenbus','look','kitten');
            assert.equal('Kittenbus', tree.read('look'));
            tree.write('Catbus');
            assert.equal('Catbus', tree.read());

        });

        it('can toggle data', function(){
            tree.write('Mei');
            tree.toggle();
            assert.equal(false, tree.read());
            tree.toggle();
            assert.equal(true, tree.read());
            tree.toggle();
            assert.equal(false, tree.read());
        });


        it('can refresh data without changing', function(){
            tree.write('Catbus');
            tree.refresh();
            assert.equal('Catbus', tree.read());
        });

        it('makes sensors with update topic', function(){
            var fish = boat.sensor();
            fish.run(_logger);
            boat.write('scales');
            assert.equal('update', fish.attr('on'));
        });

        it('and other topics', function(){
            var fish = boat.on('waves');
            assert.equal('waves', fish.attr('on'));
        });

        it('makes multi-sensors with topics', function(){
            var tanks = lands.on(['update','destroy']);
            assert.equal(6, tanks.attr('tag').length);
            tanks.attr({'keep':'first','on':'meow'});
        });

        it('moooo', function(){
            var bugs = lands.sensor();
            bugs.run(_logger);
            bugs = bugs.merge();
            bugs.run(_logger);
            tree.write('poop');
            bus.location('desert').write('dry');
        });

    });


    describe('Sensors', function(){

        describe('other stuff', function() {

            it('runs this', function () {
                _reset();

                if(girl){
                    girl.drop();
                }
                girl = castle.on('update').run(_callback);
                castle.write('walking', 'update');
                assert.equal(1, _invoked);
                girl.drop();
            });


        });



        describe('basic subscribe and drop', function() {

            beforeEach(function(){
                _reset();
                girl = castle.on('update').as(_script).run(_callback);
            });

            afterEach(function(){
                girl.drop();
            });

            it('runs callback', function () {
                castle.write('walks');
                assert.equal(1, _invoked);
            });

            it('receives messages', function () {
                castle.write('howls');
                assert.equal('howls', _msg);
            });

            it('receives topics', function () {
                castle.write('flies');
                assert.equal('update', _topic); // topic defaults to update
            });

            it('receives tags', function () {
                castle.write('stone');
                assert.equal('castle', _tag);
            });

            it('run in assigned script context', function () {
                castle.write('fungus');
                assert.equal(999, _context.ohmu);
            });

            it('holds last message', function () {
                castle.write('spores');
                assert.equal('spores', girl.read());
            });

            it('drops subscription', function () {

                girl.drop();
                castle.write('silence');
                assert.equal('silence', castle.read()); // location has new data
                assert.equal(undefined, girl.read()); // sensor has no data
                assert.equal(0, _invoked); // did not run callback

            });

        });


        describe('transformations', function() {

            beforeEach(function(){
                _reset();
                girl = castle.on('update').as(_script).run(_callback);
            });

            afterEach(function(){
                girl.drop();
            });

            it('can adapt incoming message', function () {
                girl.adapt('meow');
                castle.write('Howl flies'); // topic defaults to update
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('meow', _msg); // invoke callback once more
            });

            it('can clear adapt for incoming message', function () {
                girl.adapt();
                castle.write('iron'); // topic defaults to update
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('iron', _msg); // invoke callback once more
            });

            it('can adapt incoming message dynamically', function () {
                girl.on('amulet').adapt(function(msg, topic, tag){ return msg + ':' + topic + ':' + tag;});
                castle.write('sky', 'amulet');
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('sky:amulet:castle', _msg); // receive concatenated msg result
            });


            it('can adapt incoming message dynamically then transform output', function () {
                girl.on('amulet').adapt('blue').change();
                castle.write('sky', 'amulet');
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('blue', _msg); // receive adapted msg result
                girl.transform('green');
                castle.write('stone', 'amulet');
                assert.equal(1, _invoked); // callback blocked by change and adapt combo
                girl.change(false);
                castle.write('stone', 'amulet');
                assert.equal(2, _invoked); // invoke callback once more with change off
                assert.equal('green', _msg); // receive transformed msg result
            });

            it('can emit outgoing topic', function () {
                girl.emit('meow');
                castle.write('robot'); // topic defaults to update
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('robot', _msg); //
                assert.equal('meow', _topic); // topic is emitted as meow now instead of update
            });

            it('can clear emit topic', function () {
                girl.emit('sword');
                girl.emit();
                castle.write('insect'); // topic defaults to update
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('insect', _msg); //
                assert.equal('update', _topic); // topic is emitted as meow now instead of update
            });

            it('can dynamically emit topic', function () {
                girl.emit(function(msg){ return msg + ' strike'});
                castle.write('insect'); // topic defaults to update
                assert.equal(1, _invoked); // invoke callback once more
                assert.equal('insect', _msg); //
                assert.equal('insect strike', _topic); // topic is emitted as meow now instead of update
            });

        });


        describe('alternate topics', function() {

            beforeEach(function(){
                _reset();
                girl = castle.on('update').as(_script).run(_callback);
            });

            afterEach(function(){
                girl.drop();
            });

            it('runs callback on topic', function () {
                girl.on('fly').run(_callback);
                castle.write('Howl flies', 'fly');
                assert.equal(1, _invoked);
            });

            it('only for given topic', function () {
                castle.write('Howl flies'); // topic defaults to update
                assert.equal(1, _invoked); // did not invoke callback again
            });

            it('can change to topic multiple times', function () {

                girl.on('fly').run(_callback); // should no longer listen to topic 'fly' only 'update'
                girl.on('update');
                girl.on('fly'); // should no longer listen to topic 'fly' only 'update'

                castle.write('Howl flies', 'fly');
                castle.write('Howl flies', 'update'); // topic defaults to update
                assert.equal(1, _invoked); // callback invoked once more
                assert.equal('fly', _topic);

            });

            it('still drops subscription to all', function () {

                girl.drop();
                castle.write('Howl moves');
                assert.equal('Howl moves', castle.read()); // location has new data
                assert.equal('Howl flies', castle.read('fly')); // location still has alternate topic data
                assert.equal(undefined, girl.read()); // sensor has no data
                assert.equal(0, _invoked); // did not run callback

            });

        });




        describe('sleep and wake', function() {


            it('runs callback', function () {
                _reset();
                girl = castle.on().run(_callback);
                castle.write('Laputa');
                assert.equal(1, _invoked);
            });

            it('goes to sleep', function () {
                _reset();
                girl.sleep();
                castle.write('in the sky');
                assert.equal(0, _invoked); // did not invoke callback while sleeping
                assert.equal(false, girl.attr('active'));
            });

            it('wakes from sleep', function () {
                _reset();
                girl.wake();
                castle.write('burning the sea');
                assert.equal(1, _invoked); // invoked callback after waking
                assert.equal(true, girl.attr('active'));
                girl.drop();
            });

        });


        describe('when to run', function() {

            beforeEach(function(){
                _reset();
                ohmu = valley.on('update').run(_callback);
            });

            afterEach(function(){
                ohmu.drop();
            });


            //yupa = airship.on('sword').run(_callback);

            it('change flag suppresses successive duplicates', function () {

                ohmu.change();
                valley.write('Spores descend');
                valley.write('Spores descend');
                valley.write('Spores descend');
                valley.write('Spores spread...');
                valley.write('Spores spread...');
                valley.write('Spores spread...');
                assert.equal(2, _invoked);

            });

            it('filter function suppresses false returns', function () {

                ohmu.filter(function(msg){
                   return msg && msg.indexOf('red') >= 0;
                });

                valley.write('eyes are red');
                valley.write('eyes are blue');
                valley.write('eyes are blue');
                valley.write('eyes are red');
                valley.write('eyes are red');

                assert.equal(3, _invoked);
                assert.equal('eyes are red', _msg);

            });


        });

        describe('piping', function() {

            beforeEach(function(){

                _reset();

                ohmu = valley.on('update').run(_callback);
                yupa = airship.on('update').pipe(valley);
                girl = castle.on('update');
                girl.pipe(airship);

            });

            afterEach(function(){

                ohmu.drop();
                yupa.drop();
                girl.drop();

            });


            it('direct pipe', function () {

                airship.write('over the valley');
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);

            });

            it('pipe to pipe', function () {

                castle.write('in the castle');
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);

            });


        });


        describe('batching', function() {

            function floodCastle(){
                castle.write('Mononoke');
                castle.write('Ashitaka');
                castle.write('San');
            }

            function floodWorld(){
                castle.write('Ponyo','update','fish');
                castle.write('Nausicaa', 'update', 'spores');
                castle.write('Yupa', 'update', 'spores');
            }

            beforeEach(function(){
                _reset();
                girl = castle.on().batch().run(_callback);
            });

            afterEach(function(){
                girl.drop();
            });

            it('avoids callback from batch until flush', function () {

                floodCastle();
                assert.equal(0, _invoked);
                bus.flush();

            });

            it('runs callback from batch after flush, last message default', function () {

                floodCastle();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('San', _msg);

            });

            it('batch keeps first message', function () {

                girl.keep('first');
                floodCastle();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('Mononoke', _msg);

            });

            it('batch keeps all messages', function () {

                girl.keep('all');
                floodCastle();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal(3, _msg.length);

            });

            it('batches all and sets emit topics', function () {

                girl.keep('all').emit(function(msg){ return 'count is ' + msg.length;});
                floodCastle();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal(3, _msg.length);
                assert.equal('count is 3', _topic);
            });

            it('batch into groups with emit topics', function () {

                girl.group().emit(function(msg){ return 'fish is ' + msg.fish;});
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('San', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Yupa', _msg.spores);
                assert.equal('fish is Ponyo', _topic);

            });

            it('batch into groups of messages by tag, last per tag default', function () {

                girl.group();
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('San', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Yupa', _msg.spores);

            });

            it('batch into groups of messages by tag, first per tag', function () {

                girl.group().keep('first');
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('Mononoke', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Nausicaa', _msg.spores);

            });

            it('batch into groups of messages by tag, lists of all received', function () {

                girl.group().keep('all');
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal(3, _msg.castle.length);
                assert.equal(1, _msg.fish.length);
                assert.equal(2, _msg.spores.length);

            });

            it('batch into groups of messages by tag, retain last across flushes', function () {

                girl.group().retain(); // keep('last') is default
                floodCastle();
                bus.flush();
                floodWorld();
                bus.flush();
                assert.equal(2, _invoked);
                assert.equal('San', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Yupa', _msg.spores);

            });

            it('batch into groups of messages by tag, retain first across flushes', function () {

                girl.group().retain().keep('first');
                floodCastle();
                bus.flush();
                floodWorld();
                bus.flush();
                assert.equal(2, _invoked);
                assert.equal('Mononoke', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Nausicaa', _msg.spores);

            });

            it('batch into groups of messages by tag, retain all across flushes', function () {

                girl.group().retain().keep('all');
                floodCastle();
                bus.flush();
                floodWorld();
                floodCastle();
                bus.flush();

                assert.equal(2, _invoked);
                assert.equal(6, _msg.castle.length);
                assert.equal(1, _msg.fish.length);
                assert.equal(2, _msg.spores.length);

            });

            it('batch only after needs fulfilled', function () {

                girl.group().keep('first').need(['fish','spores']);
                floodCastle();
                bus.flush();
                assert.equal(0, _invoked);
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                floodCastle();
                bus.flush(); // does not send again
                assert.equal(1, _invoked);


            });


            it('batch repeatedly after needs are retained', function () {

                girl.group().retain().keep('first').need(['fish','spores']);
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                girl.keep('last');
                floodCastle();
                bus.flush(); // does send again since needs were retained
                assert.equal(2, _invoked);
                bus.flush(); // but not again without additional messages
                assert.equal(2, _invoked);
                floodCastle();
                bus.flush(); // and one more again for good measure
                assert.equal(3, _invoked);

            });

        });

        describe('piping batches', function() {

            function floodCastle(){
                castle.write('Asbel', 'update', 'wind');
                castle.write('Teto', 'update', 'wind');
                castle.write('Jihl');
            }

            function floodAirship(){
                airship.write('Kushana', 'update','armor');
                airship.write('Kurotowa', 'update', 'armor');
                airship.write('Nausicaa', 'update', 'wind');
            }

            beforeEach(function(){

                _reset();

                ohmu = valley.on('update').run(_callback);
                yupa = airship.on('update').pipe(valley).batch();
                girl = castle.on('update').pipe(airship);

            });

            afterEach(function(){

                ohmu.drop();
                yupa.drop();
                girl.drop();

            });


            it('direct batch pipe, last message fires once', function () {

                floodAirship();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);
                assert.equal('Nausicaa', _msg);

            });

            it('direct batch pipe, grouped', function () {

                ohmu.batch();
                yupa.group();
                floodAirship();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);
                assert.equal('Nausicaa', _msg.wind);
                assert.equal('Kurotowa', _msg.armor);

            });




        });





    });


});


