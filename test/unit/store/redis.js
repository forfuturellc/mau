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
    const prefix = "test:mau:redis:";

    it("[#put()] allows custom client", async function() {
        const customPrefix = `${prefix}custom:`;
        const customClient = redis.createClient();
        await customClient.connect();
        const customStore = new RedisSessionStore({ client: customClient, prefix: customPrefix });
        await customClient.del(sid);
        await customStore.put(sid, session, defaultOptions);
        const data = await customClient.get(`${customPrefix}${sid}`);
        assert.ok(data);
    });
});
