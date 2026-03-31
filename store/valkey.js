/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const Valkey = require("iovalkey");


// own modules
const errors = require("../lib/errors");
const SessionStore = require("./base");


class ValkeySessionStore extends SessionStore {
    /**
     * @constructor
     * @param  {Object} [options] Options passed to 'new Valkey()' (if `options.client` is *not* provided)
     * @param  {RedisClient} [options.client] An existing client
     * @see https://github.com/valkey-io/iovalkey#connect-to-valkey
     */
    constructor(options={}) {
        super();
        if (options.client) {
            this.client = options.client;
            this._connected = true;
        } else {
            this.client = new Valkey({
                ...options,
                lazyConnect: true,
            });
            this.client.on("error", (error) => this.emit("error", error));
            this._connected = false;
        }
    }
    async _connect() {
        if (!this._connected) {
            await this.client.connect();
            this._connected = true;
        }
    }
    async get(sid) {
        await this._connect();
        const data = await this.client.get(sid);
        if (!data) {
            return null;
        }
        try {
            return JSON.parse(data);
        } catch (error) {
            throw new errors.SessionError(error);
        }
    }
    async put(sid, session, options) {
        await this._connect();
        const args = [sid, JSON.stringify(session)];
        if (options.ttl && options.ttl !== +Infinity) {
            args.push("PX", options.ttl);
        }
        await this.client.set(...args);
    }
    async del(sid) {
        await this._connect();
        const removed = await this.client.del(sid);
        return removed === 1;
    }
}


exports = module.exports = ValkeySessionStore;
