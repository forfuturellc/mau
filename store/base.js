/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const EventEmitter = require("events");


/** SessionStore Class */
class SessionStore extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Retrieve the session.
     * @param  {String} sid Session ID
     * @returns {Promise<Session>}
     */
    async get(sid) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#get()");
    }

    /**
     * Save session.
     * @param  {String} sid Session ID
     * @param  {Object} session Session object
     * @param  {Object} options
     * @param  {Number} options.ttl Session TTL. Equals `+Infinity` to
     *  have the session stored indefinitely.
     * @returns {Promise<void>}
     */
    async put(sid, session, options) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#put()");
    }

    /**
     * Destroy session.
     * @param  {String} sid Session ID
     * @returns {Promise<boolean>} Resolves to a boolean
     *  indicating whether the session has been removed.
     */
    async del(sid) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#del()");
    }
}


exports = module.exports = SessionStore;
