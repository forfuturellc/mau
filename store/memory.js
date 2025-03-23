/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const memory = require("memory-cache");
const uuid = require("uuid");


// own modules
const SessionStore = require("./base");


class MemorySessionStore extends SessionStore {
    constructor() {
        super();
        this.id = uuid.v4();
    }
    _prefixSid(sid) {
        return `${this.id}:${sid}`;
    }
    async get(sid) {
        return memory.get(this._prefixSid(sid));
    }
    async put(sid, session, options) {
        const ttl = options.ttl === +Infinity ? undefined : options.ttl;
        memory.put(this._prefixSid(sid), session, ttl);
    }
    async del(sid) {
        memory.del(this._prefixSid(sid));
    }
}


exports = module.exports = MemorySessionStore;
