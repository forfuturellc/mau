/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const EventEmitter = require("events");


/** Adapter Class */
class Adapter extends EventEmitter {
    /**
     * Emits `unhandledMessage(chatId, text)` if no form processed a message.
     * @constructor
     * @param  {FormSet} formset Associated formset
     * @param  {Object} [options] Options for the adapter
     */
    constructor(formset, options) { // eslint-disable-line no-unused-vars
        super();
        this.formset = formset;
        this.options = options || {};
    }

    /**
     * Handle query.
     * @param  {String} query Query
     * @param  {Object} ref Reference
     */
    handleQuery(query, ref) { // eslint-disable-line no-unused-vars
        throw new Error("Not Implemented: Adapter#handleQuery()");
    }
}


exports = module.exports = Adapter;
