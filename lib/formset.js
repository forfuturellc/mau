/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const EventEmitter = require("events");


// installed modules
const Debug = require("debug");


// own modules
const constants = require("./constants");
const errors = require("./errors");
const Form = require("./form");
const MemoryStore = require("../store/memory");
const Session = require("./session");


// module variables
const debug = Debug("mau:formset");


/**
 * @class FormSet
 * @private
 */
class FormSet extends EventEmitter {
    /**
     * Emits `query(question, ref)` event.
     * @constructor
     * @param  {Object} [options]
     * @param  {String} [options.prefix="form:"] Prefix for session ID
     * @param  {SessionStore} [options.store=MemorySessionStore] Session store.
     * @param  {Number} [options.ttl=+Infinity] Time-To-Live for sessions.
     * Ensure that the session store you use does supports using TTL-ed sessions.
     */
    constructor(options={}) {
        debug("constructing new formset");
        super();
        this.options = options;
        this.options.prefix = options.prefix || "form:";
        this.options.store = options.store || new MemoryStore();
        this.options.ttl = typeof options.ttl === "number" ? options.ttl : +Infinity;
        this._forms = [];
    }

    /**
     * Helper function for easier access to registered store.
     * @private
     */
    get _store() {
        return this.options.store;
    }

    /**
     * @private
     * Return the 'chatID' prefixed with the form's prefix.
     * @param  {String|Number} chatID
     * @return {String} prefixed chatID
     * @example
     * // returns 'form:12345' (if prefix is "form:")
     * formset._prefix("12345");
     */
    _prefix(chatID) {
        return `${this.options.prefix}${chatID}`;
    }

    /**
     * Return the added forms.
     * @return {Form[]}
     */
    getForms() {
        return this._forms;
    }

    // TODO: i18n should also use promises!

    /**
     * Add a new form to this set.
     * @param  {String} name Name of the form e.g. "profile"
     * @param  {Array} queries Queries to be asked to user
     * @param  {Object} [options] Options
     * @param  {Function} [options.cb(answers, ref)] Invoked with the final
     * answers, when the form has been completed.
     * @param  {Function} [options.i18n(text, ctx, ref)] Internationalization
     * function.
     * @return {Form} created form
     */
    addForm(name, queries, options) {
        debug("adding new form: %s", name);
        const form = new Form(name, queries, options);
        this._forms.push(form);
        return form;
    }

    /**
     * Process the message using a certain form.
     *
     * If `chatID` is a Number, it is converted to string, using
     * `.toString()`.
     *
     * If `ref` is a Function, it is invoked once and its return value
     * used as the actual reference.
     *
     * @example <caption>chatID as Number</caption>
     * // the two invocations below are 'similar'
     * formset.processForm(name, "12345", ref);
     * formset.processForm(name, 12345, ref);
     *
     * @example <caption>FormNotFoundError</caption>
     * // Assuming there's no form with the name '404'.
     * formset.processForm("404", chatID, ref).catch(function(error) {
     *     assert.ok(error instanceof mau.errors.FormNotFoundError);
     * });
     *
     * @example <caption>BusyError</caption>
     * // Assuming there's a form already being processed.
     * formset.processForm(name, chatID, ref).catch(function(error) {
     *     assert.ok(error instanceof mau.errors.BusyError);
     * });
     *
     * @param  {String} name Name of form
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {Object|Function} ref Reference
     * @param  {Object} [options] Options
     * @param  {Object} [options.answers] Initial answers hash
     * @throws {BusyError} if form is already being processed.
     * @throws {FormNotFoundError} if form is not found.
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    async processForm(name, chatID, ref, options={}) {
        debug("processing form '%s' for chat '%s'", name, chatID);
        options.form = this._forms.find((form) => {
            return form.name === name;
        });
        if (!options.form) {
            debug("form not found: %s", name);
            throw new errors.FormNotFoundError(name);
        }
        return await this._process(chatID, ref, options);
    }

    /**
     * Process a message. This is a variant of `FormSet#processForm()`
     * method. It tries to service the message using an active form,
     * which if not found, a `FormNotFoundError` error is thrown.
     *
     * @example
     * // Assuming there's a form named 'hello'
     * await formset.process(chatID, text, ref).catch(function (error) {
     *      if (error instanceof mau.errors.FormNotFoundError) {
     *         // There's NO active form.
     *         // Let's trigger the 'hello' form.
     *         await formset.processForm("hello", chatID, text, ref);
     *     }
     * });
     *
     * @param  {String|Number} chatID Unique identifier for the originating
     *  chat
     * @param  {String} text Text of the message
     * @param  {Object|Function} ref Reference
     * @throws {FormNotFoundError} if form is not found.
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    async process(chatID, text, ref) {
        return await this._process(chatID, ref, { text });
    }

    /**
     * @private
     * @param  {String|Number} chatID Unique identifier for the originating
     *  chat
     * @param  {Object|Function} ref Reference
     * @param  {Object} options
     * @param  {String} [options.text] Text to use to process current form
     * @param  {Object} [options.form] Form to use
     * @param  {Object} [options.answers] Answers object to start with. Only
     *  to be used when `options.form` has been provided.
     * @throws {BusyError} if form is already being processed, not found
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    async _process(chatID, ref, options) {
        debug("processing message: chatID=%s", chatID);
        chatID = chatID.toString();
        const _this = this;
        const sid = this._prefix(chatID);
        const text = options.text || null;
        let form = options.form;
        let session;

        debug("retrieving session: %s", sid);
        try {
            session = await this._store.get(sid);
        } catch (error) {
            debug("error retrieving session from store: %s, %s", sid, error);
            throw new errors.SessionError(error);
        }

        if (session) {
            if (session.version !== constants.SESSION_VERSION) {
                throw new errors.SessionError(`${session.version}: incompatible version (wanted=${constants.SESSION_VERSION})`);
            }
            // If a form has been provided and a session exists,
            // we return an error
            if (form) {
                throw new errors.BusyError(`${session.form}: already processing`);
            }
            debug(`searching for form by '${session.form}'`);
            form = this._forms.find((f) => f.name === session.form);
        }

        if (!form) {
            debug("no available form");
            throw new errors.FormNotFoundError(session && session.form);
        }

        if (typeof ref === "function") {
            ref = ref(form.name, form);
        }

        if (!session) {
            session = Session.initialize(chatID, form, {
                answers: options.answers,
            });
        }

        const { question, session: updatedSession } = await form.process(this, session, text, ref);
        session = updatedSession;

        if (!question) {
            try {
                debug("destroying session: %s", sid);
                await this._store.del(sid);
            } catch (error) {
                debug("error deleting session: %s", error);
                throw new errors.SessionError(error);
            }
            return await form._invokeCb(_this, session.answers, ref);
        }

        try {
            debug("saving session: %s, %j", sid, session);
            await this._store.put(sid, session, {
                ttl: _this.options.ttl,
            });
        } catch (error) {
            debug("error saving session: %s", error);
            throw new errors.SessionError(error);
        }

        this.emit("query", question, ref);
    }

    /**
     * Cancel current form processing for chat.
     * @param  {String|Number} chatID  Unique identifier for the originating
     *  chat
     * @throws {SessionError} if fails to cancel form processing
     * @todo Test this method!
     */
    async cancel(chatID) {
        debug("cancel form processing: chatID=%s", chatID);
        const sid = this._prefix(chatID.toString());
        try {
            return await this._store.del(sid);
        } catch (error) {
            throw new errors.SessionError(error);
        }
    }
}


exports = module.exports = FormSet;
