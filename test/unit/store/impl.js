/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// own modules
const SessionStore = require("../../../store/base");
const MemoryStore = require("../../../store/memory");
const RedisStore = require("../../../store/redis");


const defaultOptions = { ttl: +Infinity };
const session = { key: "value" };
const sid = "SID";
const tests = [
    {
        suite: "MemoryStore impl.",
        constructor: MemoryStore,
        init: () => {
            return new MemoryStore();
        },
    },
    {
        suite: "RedisStore impl.",
        constructor: RedisStore,
        init: () => {
            return new RedisStore({
                prefix: "test:mau:",
            });
        },
    },
];
for (const test of tests) {
    testImplementation(test);
}


function testImplementation(test) {
    describe(test.suite, function() {
        let store;

        beforeEach(function(done) {
            store = test.init();
            store.del(sid, done);
        });

        it("is exported as a Function/constructor", function() {
            assert.equal(typeof test.constructor, "function");
        });

        it("sub-classes SessionStore", function() {
            assert.ok(store instanceof SessionStore);
        });

        describe("#put()", function() {
            it("[#get()] saves key-value pair", function(done) {
                store.put(sid, session, defaultOptions, function(error) {
                    assert.ifError(error);
                    store.get(sid, function(error, sess) {
                        assert.ifError(error);
                        assert.deepEqual(sess, session, "Incorrect session returned.");
                        return done();
                    });
                });
            });

            it("adds expiry time", function (done) {
                const expiringSid = `${sid}-expiring`;
                const nonExpiringSid = `${sid}-nonexpiring`;
                store.put(nonExpiringSid, session, { ttl: +Infinity }, function(error) {
                    assert.ifError(error);
                    store.put(expiringSid, session, { ttl: 500 }, function (error) {
                        assert.ifError(error);
                        setTimeout(() => {
                            store.get(nonExpiringSid, function (error, sess) {
                                assert.ifError(error);
                                assert.ok(sess, "Session is missing");
                                store.get(expiringSid, function (error, sess) {
                                    assert.ifError(error);
                                    assert.ok(!sess, "Session still exists");
                                    done();
                                });
                            });
                        }, 750);
                    });
                });
            });
        });

        describe("#del()", function() {
            it("[#put()] deletes session", function(done) {
                store.put(sid, session, defaultOptions, function(error) {
                    assert.ifError(error);
                    store.del(sid, function(error) {
                        assert.ifError(error);
                        store.get(sid, function(error, sess) {
                            assert.ifError(error);
                            assert.ok(!sess, "Session not destroyed.");
                            return done();
                        });
                    });
                });
            });
        });
    });
}


exports = module.exports = {
    defaultOptions,
    session,
    sid,
};
