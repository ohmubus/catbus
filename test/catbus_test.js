//run mocha from project root

var util = require('util');
var assert = require('assert');
var bus = require('../public/js/catbus.js');


var _invoked = 0;
var _msg;
var _topic;
var _tag;
var _context;

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

var _reset = function(){

    _context = undefined;
    _msg = undefined;
    _topic = undefined;
    _tag = undefined;
    _invoked = 0;

};


var tree, boat, castle, valley, airship, girl, ohmu, yupa;

castle = bus.at('castle');
valley  = bus.at('valley');
airship  = bus.at('airship');



describe('Catbus', function(){

    before(function(){
        tree = bus.at('tree');
        boat = bus.at('boat', 'Ponyo');
    });

    describe('Locations', function(){


        it('makes locations', function(){
            assert.equal('object', typeof tree);
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
            var fish = boat.on();
            assert.equal('update', fish.topic());
        });

        it('and other topics', function(){
            var fish = boat.on('waves');
            assert.equal('waves', fish.topic());
        });

    });


    describe('Sensors', function(){

        describe('other stuff', function() {

            it('runs this', function () {
                _reset();

                if(girl){
                      console.log('ack----');
                      console.log(girl);
                    girl.drop();
                } else {
                    console.log('nak----');
                }
                girl = castle.on('update').run(_callback);
                castle.write('walking', 'update');
                assert.equal(1, _invoked);
                girl.drop();
            });



        });



        //describe('other stuff', function() {
        //
        //
        //    it('runs callback', function () {
        //        _reset();
        //        girl = castle.on('update').run(_callback);
        //        castle.write('Howl flies', 'update');
        //        assert.equal(1, _invoked);
        //    });
        //
        //    it('only for given topic', function () {
        //        castle.write('Howl flies'); // topic defaults to update
        //        assert.equal(1, _invoked); // did not invoke callback again
        //    });
        //
        //    it('can change to old topic', function () {
        //        girl.on('update').run(_callback);
        //        castle.write('Howl flies'); // topic defaults to update
        //        assert.equal(2, _invoked); // invoke callback once more
        //    });
        //
        //    it('still drops subscription to all', function () {
        //
        //        _reset();
        //        girl.drop();
        //        castle.write('Howl moves');
        //        assert.equal('Howl moves', castle.read()); // location has new data
        //        assert.equal('Howl flies', castle.read('fly')); // location still has alternate topic data
        //        assert.equal(undefined, girl.read()); // sensor has no data
        //        assert.equal(0, _invoked); // did not run callback
        //
        //    });
        //
        //});


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




        describe('alternate topics', function() {

            _reset();

            it('runs callback', function () {
                girl = castle.on('fly').run(_callback);
                castle.write('Howl flies', 'fly');
                assert.equal(1, _invoked);
            });

            it('only for given topic', function () {
                castle.write('Howl flies'); // topic defaults to update
                assert.equal(1, _invoked); // did not invoke callback again
            });

            it('can change to old topic', function () {
                girl = castle.on('update').run(_callback);
                castle.write('Howl flies'); // topic defaults to update
                assert.equal(2, _invoked); // invoke callback once more
            });

            it('still drops subscription to all', function () {

                _reset();
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
                assert.equal(false, girl.active());
            });

            it('wakes from sleep', function () {
                _reset();
                girl.wake();
                castle.write('burning the sea');
                assert.equal(1, _invoked); // invoked callback after waking
                assert.equal(true, girl.active());
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

            it('batch into groups of messages by tag, last per tag default', function () {

                girl.group();
                floodCastle();
                floodWorld();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('San', _msg.castle);
                assert.equal('Ponyo', _msg.fish);
                assert.equal('Yupa', _msg.spores);
                console.log(_msg);

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
                //console.log(_msg);
                assert.equal(2, _invoked);
                assert.equal(6, _msg.castle.length);
                assert.equal(1, _msg.fish.length);
                assert.equal(2, _msg.spores.length);

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

                ohmu.batch().group();
                yupa.group();
                floodAirship();
                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);
                assert.equal('Nausicaa', _msg.wind);
                assert.equal('Kurotowa', _msg.armor);

            });

            it('pipe batch to pipe batch, grouped', function () {

                ohmu.batch().group();
                girl.batch().group();
                yupa.group();

                floodCastle();
                floodAirship();
                floodCastle();

                bus.flush();
                assert.equal(1, _invoked);
                assert.equal('valley', _tag);
                assert.equal('Teto', _msg.wind);
                assert.equal('Kurotowa', _msg.armor);


            });


        });





    });


});


