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
     * @param  {Object} [session]
     * @return {Object} Initialized session
     */
    initialize(session={}) {
        debug("initializing session");
        session.version = constants.SESSION_VERSION;
        session.form = this.name;
        session.query = null;
        session.choices = null;
        session.answers = {};
        return { session };
    }

    /**
     * Process a message.
     * @param  {Object} session Session to be used in this context
     * @param  {String} text Text of the message
     * @param  {Object} ref Reference
     * @param  {Function} done(error, session, question)
     */
    process(session, text, ref, done) {
        debug("processing message '%s' in session '%j'", text, session);
        if (!session) {
            const data = this.initialize();
            session = data.session;
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
