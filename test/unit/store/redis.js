/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// installed modules
const redis = require("redis");


// own modules
const RedisSessionStore = require("../../../store/redis");
const { defaultOptions, session, sid } = require("./impl");


describe("RedisSessionStore", function() {
    const prefix = "test:mau:";

    it("[#put()] allows custom client", function(done) {
        const customPrefix = `${prefix}custom:`;
        const customClient = redis.createClient({
            prefix: customPrefix,
        });
        const customStore = new RedisSessionStore({ client: customClient });
        customClient.del(sid, function(error) {
            assert.ifError(error);
            customStore.put(sid, session, defaultOptions, function(error) {
                assert.ifError(error);
                customClient.get(sid, function(error, data) {
                    assert.ifError(error);
                    assert.ok(data);
                    return done();
                });
            });
        });
    });
});
