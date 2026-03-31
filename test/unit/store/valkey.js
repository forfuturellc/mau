/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// installed modules
const Valkey = require("iovalkey");


// own modules
const ValkeySessionStore = require("../../../store/valkey");
const { defaultOptions, session, sid } = require("./impl");


describe("ValkeySessionStore", function() {
    const prefix = "test:mau:valkey:";

    it("[#put()] allows custom client", async function() {
        const customPrefix = `${prefix}custom:`;
        const customClient = new Valkey({
            keyPrefix: customPrefix,
        });
        const customStore = new ValkeySessionStore({ client: customClient });
        await customClient.del(sid);
        await customStore.put(sid, session, defaultOptions);
        const data = await customClient.get(sid);
        assert.ok(data);
    });
});
