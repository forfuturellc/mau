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

        beforeEach(async function() {
            store = test.init();
            await store.del(sid);
        });

        it("is exported as a Function/constructor", function() {
            assert.equal(typeof test.constructor, "function");
        });

        it("sub-classes SessionStore", function() {
            assert.ok(store instanceof SessionStore);
        });

        describe("#put()", function() {
            it("[#get()] saves key-value pair", async function() {
                await store.put(sid, session, defaultOptions);
                const sess = await store.get(sid);
                assert.deepEqual(sess, session, "Incorrect session returned.");
            });

            it("adds expiry time", async function () {
                const expiringSid = `${sid}-expiring`;
                const nonExpiringSid = `${sid}-nonexpiring`;
                await store.put(nonExpiringSid, session, { ttl: +Infinity });
                await store.put(expiringSid, session, { ttl: 500 });
                await new Promise(r => setTimeout(r, 750));
                const sess1 = await store.get(nonExpiringSid);
                assert.ok(sess1, "Session is missing");
                const sess2 = await store.get(expiringSid);
                assert.ok(!sess2, "Session still exists");
            });
        });

        describe("#del()", function() {
            it("[#put()] deletes session", async function() {
                await store.put(sid, session, defaultOptions);
                await store.del(sid);
                const sess = await store.get(sid);
                assert.ok(!sess, "Session not destroyed.");
            });
        });
    });
}


exports = module.exports = {
    defaultOptions,
    session,
    sid,
};
