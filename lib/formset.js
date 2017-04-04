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
const Form = require("./form");
const MemoryStore = require("../store/memory");


// module variables
const debug = Debug("mau:formset");
const memory = new MemoryStore();


/** FormSet Class */
class FormSet extends EventEmitter {
    /**
     * Emits `query(question, ref)` event.
     * @constructor
     * @param  {Object} [options]
     * @param  {String} [options.prefix="form:"] Prefix for session ID
     * @param  {SessionStore} [options.store=MemorySessionStore] Session
     *  store.
     * @param  {Number} [options.ttl=+Infinity] Time-To-Live for sessions
     */
    constructor(options={}) {
        super();
        this.options = options;
        this.options.prefix = options.prefix || "form:";
        this.options.store = options.store || memory;
        this.options.ttl = typeof options.ttl === "number" ? options.ttl : +Infinity;
        this._store = this.options.store;
        this._forms = [];
    }

    /**
     * @private
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
     * Add a new form to this set.
     * @param  {String} name Name of the form e.g. "profile"
     * @param  {Array} queries Queries to be asked to user
     * @param  {Object} [options] Options
     * @param  {Function} [options.cb(answers, ref)] Invoked with the final
     *  answers
     * @param  {Function} [options.i18n(text, ctx, ref)] Internalization
     *  function
     */
    addForm(name, queries, options) {
        const form = new Form(name, queries, options);
        this._forms.push(form);
    }

    /**
     * Process the message using a certain form.
     * If a form is being processed already, an error will be passed to
     * callback.
     * @param  {String} formName Name of form
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {Object|Function} ref Reference
     * @param  {Object} [options]
     * @param  {Object} [options.answers] Initial answers hash
     * @param  {Function} done(error)
     */
    processForm(formName, chatID, ref, options, done) {
        if (!done) {
            done = options;
            options = {};
        }
        options.form = this._forms.find((form) => {
            return form.name === formName;
        });
        if (!options.form) {
            debug("form not found: %s", formName);
            return done(new Error(`enoent: ${formName}`));
        }
        return this._process(chatID, ref, options, done);
    }

    /**
     * Process a message.
     * @param  {String|Number} chatID Unique identifier for the originating
     *  chat
     * @param  {String} text Text of the message
     * @param  {Object|Function} ref Reference
     * @param  {Function} done(error) `error.code` equals `"ENOENT"` if form
     *  was not found.
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
     */
    _process(chatID, ref, options, done) {
        const _this = this;
        const sid = this._prefix(chatID);
        const text = options.text;
        let form = options.form;
        let session;
        let question;

        debug("retrieving session: %s", sid);
        return this._store.get(sid, onSessionGet);

        function onSessionGet(error, s) {
            if (error) {
                debug("error retrieving session from store: %s, %s", sid, error);
                return done(error);
            }
            session = s;
            if (session) {
                // TODO: check session version
                // If a form has been provided and a session exists,
                // we return an error
                if (form) {
                    return done(new Error(`ebusy: already processing '${session.form}'`));
                }
                debug(`searching for form by '${session.form}'`);
                form = _this._forms.find((f) => f.name === session.form);
            }
            if (!form) {
                debug("no available form");
                const error = new Error("enoent: failed to find form");
                error.code = "ENOENT";
                return done(error);
            }
            if (typeof ref === "function") {
                ref = ref(form.name, form);
            }
            return form.process(session, text, ref, options, onProcess);
        }

        function onProcess(error, s, q) {
            if (error) {
                debug("error processing in form: %s", error);
                return done(error);
            }
            session = s;
            question = q;
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
                return done(error);
            }
            if (form.options.cb) {
                debug("firing form callback");
                form.options.cb(session.answers, ref);
            }
            return done(null);
        }

        function onSessionSave(error) {
            if (error) {
                debug("error saving session: %s", error);
                return done(error);
            }
            if (!question) {
                return done();
            }
            _this.emit("query", question, ref);
            return done();
        }
    }
}


exports = module.exports = FormSet;
