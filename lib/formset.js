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
     * @constructor
     * @param  {Object} [options]
     * @param  {String} [options.prefix="query:"] Prefix for session ID
     * @param  {SessionStore} [options.store] Session store. Defaults to
     *  using a memory store.
     * @param  {Number} [options.ttl=null] Time to live for the session
     */
    constructor(options={}) {
        super();
        this.options = options;
        this.options.prefix = options.prefix || "query:";
        this.options.ttl = typeof options.ttl === "number" ? options.ttl : null;
        this.store = options.store || memory;
        this._forms = [];
    }

    /**
     * @private
     * @param  {String|Number} chatID
     * @return {String} prefixed chatID
     * @example
     * // returns 'query:12345' (if prefix is "query:")
     * formset._prefix("12345");
     */
    _prefix(chatID) {
        return `${this.options.prefix}${chatID}`;
    }

    /**
     * Add a new form to this set.
     * @param  {String} name Name of the form e.g. "profile"
     * @param  {Function|RegExp|null} test Returns/evaluates to `true` as trigger
     * @param  {Array} queries Queries to be asked to user
     * @param  {Function} cb(answers, msg) Invoked with the final answers
     */
    addForm(name, test, queries, cb) {
        if (test instanceof RegExp) {
            test = test.test.bind(test);
        } else if (test === null) {
            test = function() { return false; };
        }
        const form = new Form(name, test, queries, cb);
        this._forms.push(form);
    }

    /**
     * @private
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {*} message The original message object
     * @param  {Object} options
     * @param  {String} [options.text] Text to use to find form
     * @param  {Object} [options.form] Form to use
     * @param  {Function} done(error, text) Invoked on error or message need to be sent
     */
    _process(chatID, message, opts, done) {
        const _this = this;
        const sid = this._prefix(chatID);
        let text = opts.text || "";
        let form = opts.form;
        let session;
        let query;

        debug("retrieving session: %s", sid);
        return this.store.get(sid, onSessionGet);

        function onSessionGet(error, s) {
            if (error) {
                debug("error retrieving session from store: %s, %s", sid, error);
                return done(error);
            }
            session = s;
            if (session) {
                // TODO: check session version
                if (form) {
                    return done(new Error(`already processing form '${session.form}'`));
                }
            }
            if (!form) {
                debug("searching for form");
                const test = session ?
                    (form) => { return form.name === session.form; } :
                    (form) => { return form.test(text); };
                form = _this._forms.find(test);
                if (!form) {
                    const msg = session ?
                        `failed to find form referenced by session: ${session.form}` :
                        `failed to find qualifying form: ${text}`;
                    debug("failed to find form");
                    const error = new Error(msg);
                    error.code = "ENOENT";
                    return done(error);
                }
            }
            return form.process(session, text, message, onProcess);
        }
        function onProcess(error, s, q) {
            if (error) {
                debug("error processing in form: %s", error);
                return done(error);
            }
            session = s;
            query = q;
            if (!session) {
                debug("destroying session: %s", sid);
                // TODO: what if session could not be destroyed?
                return _this.store.del(sid, function() {});
            }
            debug("saving session: %s, %j", sid, session);
            return _this.store.put(sid, session, {
                ttl: _this.options.ttl,
            }, onSessionSave);
        }
        function onSessionSave(error) {
            if (error) {
                debug("error saving session");
                return done(error);
            }
            if (query) {
                const payload = query.query || {
                    text: query.text,
                };
                _this.emit("query", payload, message);
            }
            debug("firing process request cb");
            return done(null);
        }
    }

    /**
     * Process the message using a certain form.
     * If a form is being processed already, an error will be passed to
     * callback
     * @param  {String} form Name of form
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {*} message The original message object
     * @param  {Function} done(error, text)
     */
    processForm(form, chatID, message, done) {
        const f = this._forms.find((f) => {
            return f.name === form;
        });
        if (!f) {
            debug("form not found: %s", form);
            return done(new Error("no such form"));
        }
        return this._process(chatID, message, { form: f }, done);
    }

    /**
     * Process a message.
     * @param  {String|Number} chatID Unique identifier for the originating chat
     * @param  {String} text Text of the message
     * @param  {*} message The original message object
     * @param  {Function} done(error, text) Invoked on error or message need to be sent
     */
    process(chatID, text, message, done) {
        return this._process(chatID, message, { text }, done);
    }
}


exports = module.exports = FormSet;
