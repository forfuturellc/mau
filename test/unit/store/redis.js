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
const RedisStore = require("../../../store/redis");


describe("RedisStore", function() {
    const sid = "SID";
    const session = { key: "value" };
    const options = { ttl: +Infinity };
    let store;

    beforeEach(function() {
        store = new RedisStore({
            prefix: "test:mau:",
        });
    });

    it("is exported as a Function/constructor", function() {
        assert.equal(typeof RedisStore, "function");
    });
    it("sub-classes SessionStore", function() {
        assert.ok(store instanceof SessionStore);
    });

    describe("#put()", function() {
        it("[#get()] saves key-value pair", function(done) {
            store.put(sid, session, options, function(error) {
                assert.ifError(error);
                store.get(sid, function(error, sess) {
                    assert.ifError(error);
                    assert.deepEqual(sess, session, "Incorrect session returned.");
                    return done();
                });
            });
        });
    });

    describe("#del()", function() {
        it("deletes session", function(done) {
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
