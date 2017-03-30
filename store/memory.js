/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const memory = require("memory-cache");


// own modules
const SessionStore = require("./base");


class MemorySessionStore extends SessionStore {
    constructor() {
        super();
    }
    get(sid, done) {
        return done(null, memory.get(sid));
    }
    put(sid, session, options, done) {
        const ttl = options.ttl === +Infinity ? undefined : options.ttl;
        return done(null, memory.put(sid, session, ttl));
    }
    del(sid, done) {
        return done(null, memory.del(sid));
    }
}


exports = module.exports = MemorySessionStore;
