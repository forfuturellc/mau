/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");
const EventEmitter = require("events");


// installed modules
const Debug = require("debug");


// own modules
const QueryController = require("./query-controller");


// module variables
const debug = Debug("mau:form");


/**
 * @class Form
 * @private
 */
class Form extends EventEmitter {
    /**
     * @constructor
     * @param  {String} name Name of the form
     * @param  {Array} queries Array of queries
     * @param  {Object} [options] Options
     * @param  {Function} [options.cb] Callback invoked on form completion
     * @param  {Function} [options.i18n] Invoked to return internationalized text.
     * @todo Ensure the queries are valid!
     */
    constructor(name, queries, options={}) {
        debug("constructing new form: %s", name);
        assert.ok(name, "Name of form must be provided.");
        assert.ok(queries, "Queries must be provided.");
        super();
        this.name = name;
        this.queries = queries;
        this.options = options;
    }

    /**
     * Invoke form callback, if any.
     * @private
     * @param  {FormSet} formset Associated formset
     * @param  {Object} answers Current answers
     * @param  {Object} ref Reference
     */
    async _invokeCb(formset, answers, ref) {
        const event = "done";
        if (this.listenerCount(event)) {
            debug("emitting done event");
            this.emit(event, formset, answers, ref);
        }
        if (this.options.cb) {
            debug("firing form callback");
            await this.options.cb(answers, ref);
        }
    }

    /**
     * Process a message.
     * @param  {FormSet} formset Associated formset
     * @param  {Session} session Session to be used in this context
     * @param  {String|Number|Null} text Text of the message
     * @param  {Object} ref Reference
     */
    async process(formset, session, text, ref) {
        debug("processing message '%s' in session '%j'", text, session);
        assert.ok(formset, "FormSet must be provided.");
        assert.ok(session, "Session must be provided.");
        assert.ok(typeof text === "string" || typeof text === "number" || text === null, "Message text must be provided, or `null` for first query.");
        assert.ok(ref, "Reference must be provided.");
        const controller = new QueryController(formset, this, session, ref);
        return await controller.advance(text);
    }
}


exports = module.exports = Form;
