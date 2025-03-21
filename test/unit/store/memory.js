/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// own modules
const MemorySessionStore = require("../../../store/memory");
const { defaultOptions, session, sid } = require("./impl");


describe("MemorySessionStore", function() {
    describe("#put()", function() {
        it("does not affect other memory stores", function(done) {
            const store1 = new MemorySessionStore();
            const store2 = new MemorySessionStore();
            store1.put(sid, session, defaultOptions, function(error) {
                assert.ifError(error);
                store2.get(sid, function(error, sess) {
                    assert.ifError(error);
                    assert.ok(!sess, "Session shared between stores.");
                    return done();
                });
            });
        });
    });
});
