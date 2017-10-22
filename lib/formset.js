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

    /**
     * Add a new form to this set.
     * @param  {String} name Name of the form e.g. "profile"
     * @param  {Array} queries Queries to be asked to user
     * @param  {Object} [options] Options
     * @param  {Function} [options.cb(answers, ref)] Invoked with the final
     * answers, when the form has been completed.
     * @param  {Function} [options.i18n(text, ctx, ref, done)] Internationalization
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
     * formset.processForm("404", chatID, ref, function(error) {
     *     assert.ok(error instanceof mau.errors.FormNotFoundError);
     * });
     *
     * @example <caption>BusyError</caption>
     * // Assuming there's a form already being processed.
     * formset.processForm(name, chatID, ref, function(error) {
     *     assert.ok(error instanceof mau.errors.BusyError);
     * });
     *
     * @param  {String} name Name of form
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {Object|Function} ref Reference
     * @param  {Object} [options] Options
     * @param  {Object} [options.answers] Initial answers hash
     * @param  {Function} done(error)
     * @throws {BusyError} if form is already being processed.
     * @throws {FormNotFoundError} if form is not found.
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    processForm(name, chatID, ref, options, done) {
        debug("processing form '%s' for chat '%s'", name, chatID);
        if (!done) {
            done = options;
            options = {};
        }
        options.form = this._forms.find((form) => {
            return form.name === name;
        });
        if (!options.form) {
            debug("form not found: %s", name);
            return done(new errors.FormNotFoundError(name));
        }
        return this._process(chatID, ref, options, done);
    }

    /**
     * Process a message. This is a variant of `FormSet#processForm()`
     * method. It tries to service the message using an active form,
     * which if not found, a `FormNotFoundError` error is passed to `done`.
     *
     * @example
     * // Assuming there's a form named 'hello'
     * formset.process(chatID, text, ref, function(error) {
     *     if (error && error instanceof mau.errors.FormNotFoundError) {
     *         // There's NO active form.
     *         // Let's trigger the 'hello' form.
     *         formset.processForm("hello", chatID, text, ref, done);
     *     }
     *     // ...
     * });
     *
     * @param  {String|Number} chatID Unique identifier for the originating
     *  chat
     * @param  {String} text Text of the message
     * @param  {Object|Function} ref Reference
     * @param  {Function} done(error)
     * @throws {FormNotFoundError} if form is not found.
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    process(chatID, text, ref, done) {
        return this._process(chatID, ref, { text }, done);
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
     * @param  {Function} done(error)
     * @throws {BusyError} if form is already being processed, not found
     * @throws {SessionError} if session is incompatible, or any error thrown by session store.
     */
    _process(chatID, ref, options, done) {
        debug("processing message: chatID=%s", chatID);
        chatID = chatID.toString();
        const _this = this;
        const sid = this._prefix(chatID);
        const text = options.text || null;
        let form = options.form;
        let session;
        let question;

        debug("retrieving session: %s", sid);
        return this._store.get(sid, onSessionGet);

        function onSessionGet(error, s) {
            if (error) {
                debug("error retrieving session from store: %s, %s", sid, error);
                return done(new errors.SessionError(error));
            }
            session = s;
            if (session) {
                if (session.version !== constants.SESSION_VERSION) {
                    error = new errors.SessionError(`${session.version}: incompatible version (wanted=${constants.SESSION_VERSION})`);
                    return done(error);
                }
                // If a form has been provided and a session exists,
                // we return an error
                if (form) {
                    error = new errors.BusyError(`${session.form}: already processing`);
                    return done(error);
                }
                debug(`searching for form by '${session.form}'`);
                form = _this._forms.find((f) => f.name === session.form);
            }
            if (!form) {
                debug("no available form");
                const error = new errors.FormNotFoundError(session && session.form);
                return done(error);
            }
            if (typeof ref === "function") {
                ref = ref(form.name, form);
            }
            if (!session) {
                session = Session.initialize(chatID, form, {
                    answers: options.answers,
                });
            }
            return form.process(session, text, ref, onProcess);
        }

        function onProcess(error, q, s) {
            if (error) {
                debug("error processing in form: %s", error);
                return done(error);
            }
            question = q;
            session = s;
            if (!question) {
                debug("destroying session: %s", sid);
                return _this._store.del(sid, onSessionDestroy);
            }
            debug("saving session: %s, %j", sid, session);
            return _this._store.put(sid, session, {
                ttl: _this.options.ttl,
            }, onSessionSave);
        }

        function onSessionDestroy(error) {
            if (error) {
                debug("error deleting session: %s", error);
                return done(new errors.SessionError(error));
            }
            if (form.options.cb) {
                debug("firing form callback");
                form.options.cb(session.answers, ref);
            }
            return done();
        }

        function onSessionSave(error) {
            if (error) {
                debug("error saving session: %s", error);
                return done(new errors.SessionError(error));
            }
            if (!question) {
                return done();
            }
            _this.emit("query", question, ref);
            return done();
        }
    }

    /**
     * Cancel current form processing for chat.
     * @param  {String|Number} chatID  Unique identifier for the originating
     *  chat
     * @param  {Function} done callback(error, removed); `removed` is a boolean
     *  indicating whether the form was actually removed.
     * @throws {SessionError} if fails to cancel form processing
     * @todo Test this method!
     */
    cancel(chatID, done) {
        debug("cancel form processing: chatID=%s", chatID);
        chatID = chatID.toString();
        const sid = this._prefix(chatID);

        return this._store.del(sid, (error, removed) => {
            if (error) {
                return done(new errors.SessionError(error));
            }
            return done(null, removed);
        });
    }
}


exports = module.exports = FormSet;
