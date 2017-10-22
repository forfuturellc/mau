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
     * @param  {Function} done callback(error, session)
     */
    get(sid, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#get()");
    }

    /**
     * Save session.
     * @param  {String} sid Session ID
     * @param  {Object} session Session object
     * @param  {Object} options
     * @param  {Number} options.ttl Session TTL. Equals `+Infinity` to
     *  have the session stored indefinitely.
     * @param  {Function} done callback(error)
     */
    put(sid, session, options, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#put()");
    }

    /**
     * Destroy session.
     * @param  {String} sid Session ID
     * @param  {Function} done callback(error, removed) `removed` is a boolean
     *  indicating whether the session has been removed.
     */
    del(sid, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#del()");
    }
}


exports = module.exports = SessionStore;
