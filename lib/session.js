/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


exports = module.exports = {
    /**
     * Initialize and return a new session.
     * A session is always associated with a specific
     * user.
     * @private
     * @param  {String} chatID ID of chat
     * @param  {Form} form Form
     * @param  {Object} [options] Options
     * @param  {String} [options.form] Name of form
     * @param  {Object} [options.answers] Initial answers
     * @return {Session} Initialized session
     * @todo Support migrating between different session versions
     */
    initialize,
};


// built-in modules
const assert = require("assert");


// installed modules
const Debug = require("debug");


// own modules
const constants = require("./constants");


// module variables
const debug = Debug("mau:session");


function initialize(chatID, form, options={}) {
    debug("initializing session");
    assert.ok(chatID, "ID of chat must be provided.");
    assert.ok(form, "form must be provided.");
    const session = {};
    session.version = constants.SESSION_VERSION;
    session.chatID = chatID;
    session.form = form.name;
    // session.query = undefined;
    // session.text = undefined;
    // session.choices = undefined;
    session.answers = options.answers;
    return session;
}
