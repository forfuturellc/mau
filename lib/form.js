/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const Debug = require("debug");


// own modules
const constants = require("./constants");
const QueryController = require("./query-controller");


// module variables
const debug = Debug("mau:form");


/** Form Class */
class Form {
    /**
     * @constructor
     * @param  {String} name Name of the form
     * @param  {Array} queries Array of queries
     * @param  {Object} options Options
     * @param  {Function} [options.cb]
     * @param  {Function} [options.i18n]
     */
    constructor(name, queries, options) {
        debug("constructing new form: %s", name);
        this.name = name;
        this.queries = queries;
        this.options = options;
    }

    /**
     * Initialize a session.
     * @param  {Object} [options]
     * @param  {Object} [options.answers]
     * @return {Object} Initialized session
     */
    initializeSession(options={}) {
        debug("initializing session");
        const session = {};
        session.version = constants.SESSION_VERSION;
        session.form = this.name;
        session.query = null;
        session.choices = null;
        session.answers = options.answers || {};
        return session;
    }

    /**
     * Process a message.
     * @param  {Object} session Session to be used in this context
     * @param  {String} text Text of the message
     * @param  {Object} ref Reference
     * @param  {Object} [options]
     * @param  {Object} [options.answers]
     * @param  {Function} done(error, session, question)
     */
    process(session, text, ref, options, done) {
        if (!done) {
            done = options;
            options = {};
        }
        debug("processing message '%s' in session '%j'", text, session);
        if (!session) {
            session = this.initializeSession({
                answers: options.answers,
            });
        }
        const controller = new QueryController(this, session, ref);
        return controller._advance(text, (error, question) => {
            if (error) {
                return done(error);
            }
            return done(null, session, question);
        });
    }
}


exports = module.exports = Form;
