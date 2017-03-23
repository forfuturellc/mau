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
     * @param  {Function} test Returns `true` as trigger
     * @param  {Array} queries Array of queries
     * @param  {Function} cb Invoked with final answers
     */
    constructor(name, test, queries, cb) {
        debug("constructing new form: %s", name);
        this.name = name;
        this.test = test;
        this.queries = queries;
        this.cb = cb;
    }

    /**
     * Initialize a session.
     * @param  {Object} [session]
     * @return {Object} Initialized session
     */
    initialize(session={}) {
        debug("initializing session");
        const query = this.queries[0]; // TODO: missing query?
        session.version = constants.SESSION_VERSION;
        session.form = this.name;
        session.query = query.name;
        session.answers = {};
        return { session };
    }

    /**
     * Process a message.
     * @param  {Object} session Session to be used in this context
     * @param  {String} text Text of the message
     * @param  {Object} msg The original message object
     * @param  {Function} done(error, session, query) Invoked on completion
     */
    process(session, text, msg, done) {
        debug("processing message '%s' in session '%j'", text, session);
        let index = -1;
        if (!session) {
            const data = this.initialize();
            session = data.session;
        } else {
            session.answers[session.query] = text;
            index = this.queries.findIndex((query) => {
                return query.name === session.query;
            });
        }
        const controller = new QueryController(this.queries, session.answers);
        controller.setIndex(index);
        return controller.advance((error) => {
            if (error) {
                return done(error);
            }
            const nextQuery = this.queries[controller.getIndex()];
            if (nextQuery) {
                debug("resolved next query: %s", nextQuery.name);
                session.query = nextQuery.name;
                return done(null, session, nextQuery);
            }
            return done(null, session, null);
        });
    }
}


exports = module.exports = Form;
