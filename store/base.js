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
     * @param  {Function} done(error, session)
     */
    get(sid, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#get()");
    }

    /**
     * Save session.
     * @param  {String} sid Session ID
     * @param  {Object} session Session object
     * @param  {Object} options
     * @param  {Number} options.ttl=null Session TTL
     * @param  {Function} done(error)
     */
    put(sid, session, options, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#put()");
    }

    /**
     * Destroy session.
     * @param  {String} sid Session ID
     * @param  {Function} done(error)
     */
    del(sid, done) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: SessionStore#del()");
    }
}


exports = module.exports = SessionStore;
