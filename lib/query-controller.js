/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// own modules
const assert = require("assert");


// installed modules
const async = require("async");
const Debug = require("debug");


// own modules
const errors = require("./errors");


// module variables
const debug = Debug("mau:query-controller");
const WHICH_HOOK = {
    NONE: 0,
    PRE: 1,
    POST: 2,
};


/**
 * @class QueryController
 * @description
 * A query controller allows us to move from one query to the
 * next; supporting operations such as skipping to a target query.
 */
class QueryController {
    /**
     * @private
     * @constructor
     * @param  {Form} form Form
     * @param  {Session} session Session
     * @param  {Object} ref Reference
     * @throws {QueryNotFoundError} if current query is not found.
     */
    constructor(form, session, ref) {
        assert.ok(form, "Form not provided.");
        assert.ok(session, "Session not provided.");
        assert.ok(ref, "Reference not provided.");
        this.form = form;
        this.session = session;
        this.ref = ref;
        this._index = -1;
        if (session.query) {
            const index = form.queries.findIndex((query) => {
                return query.name === session.query;
            });
            if (index === -1) throw new errors.QueryNotFoundError();
            this._index = index;
        }
        // Which hook we current at
        this._whichHook = WHICH_HOOK.NONE;
        // Name of query we are skipping to.
        this._goto = null;
        // Does the user want us to stop?
        this._stop = false;
        // Does the user want us to retry the query?
        this._retry = false;
        this._retryText = null;
        // Do we skip the query?
        this._skip = false;
    }

    /**
     * Queries of the associated form.
     * @private
     */
    get _queries() {
        return this.form.queries;
    }

    /**
     * Return the current query.
     * @private
     * @return {Form.Query}
     * @throws {QueryNotFoundError} if not found.
     */
    _getCurrentQuery() {
        const query = this.currentQuery;
        if (!query) throw new errors.QueryNotFoundError();
        return query;
    }

    /**
     * The i18n function, if available.
     * @private
     */
    get _i18n() {
        return this.form.options.i18n;
    }

    /**
     * The current query, if available.
     * @private
     * @return {Form.Query}
     */
    get currentQuery() {
        return this._queries[this._index];
    }

    /**
     * Retrieve an object/hash containing all the answers.
     * @return {Object} answers
     */
    getAnswers() {
        return this.session.answers;
    }

    /**
     * Retrieve an answer.
     * If `name` is omitted/falsey, it returns answer for the current query.
     * To use `defaultValue`, `name` must be specified.
     * @param  {String} [name] Name of query
     * @param  {*} [defaultValue] Default value
     * @return {*} value
     * @throws {QueryNotFoundError} If the current query is not found.
     */
    getAnswer(name, defaultValue) {
        if (!name) name = this._getCurrentQuery().name;
        return (this.session.answers && this.session.answers[name]) || defaultValue;
    }

    /**
     * Set an answer.
     * If `name` is omitted, it sets the answer for the current query.
     * @param  {String} [name] Name of query
     * @param  {*} val New value
     * @throws {QueryNotFoundError} if current is not found.
     */
    setAnswer(name, val) {
        if (!val) {
            val = name;
            name = this._getCurrentQuery().name;
        }
        this.session.answers = this.session.answers || {};
        this.session.answers[name] = val;
        return val;
    }

    /**
     * @private
     * Advance the controller.
     * This executes the relevant 'pre' and 'post' hooks.
     * @param  {String} answer Next answer
     * @param  {Function} done(error)
     * @throws {ChoiceError} if answer is not a valid choice, or
     * choices where not found in question.
     * @throws {QueryNotFoundError} if query is not found.
     */
    advance(answer, done) {
        debug("advancing on queries: current-index=%d", this._index);
        assert.ok(answer || answer === null, "Answer must be provided.");
        assert.ok(done, "Callback must be provided.");

        return async.series([
            (next) => {
                if (!this.currentQuery) {
                    debug("current query is missing");
                    return next();
                }
                assert.ok(answer, "A `null` answer provided, where unexpected.");
                this._whichHook = WHICH_HOOK.POST;
                const choices = this.session.choices;
                if (choices) {
                    const question = this.currentQuery.question;
                    assert.ok(question, "Question in query is missing.");
                    const strict = typeof question.strict === "undefined" ?
                        true : question.strict;
                    if (strict && choices.indexOf(answer) === -1) {
                        debug("retrying question in strict mode");
                        return this.retry(question.retryText, next);
                    }
                }
                this.setAnswer(answer);
                if (!this.currentQuery.post) {
                    debug("current query lacks 'post' hook");
                    return next();
                }
                debug("executing current query 'post' hook: %s", this.currentQuery.name);
                return this.currentQuery.post.call(this, this.getAnswer(this.currentQuery.name), next);
            },
            (next) => {
                this._whichHook = WHICH_HOOK.NONE;
                // Allow retrying current query; `this.retry()` in the post hook above.
                if (this._retry) {
                    debug("retrying; skipping resolving to next query");
                    return next();
                }
                // Allow stopping processing; `this.stop()` in the post hook above.
                if (this._stop) {
                    debug("stopping form processing");
                    return next();
                }
                // Finding the next query
                return async.doWhilst((subNext) => {
                    if (this._goto) {
                        const index = this._queries.findIndex((query) => {
                            return query.name === this._goto;
                        });
                        if (index === -1) {
                            return subNext(new errors.QueryNotFoundError(`query not found (query=${this._goto})`));
                        }
                        this._index = index;
                    } else {
                        this._index++;
                    }
                    this._goto = null;
                    this._skip = false;
                    if (!this.currentQuery) {
                        debug("next query missing");
                        return subNext();
                    }
                    if (!this.currentQuery.pre) {
                        debug("next query lacks 'pre' hook");
                        return subNext();
                    }
                    debug("executing next query 'pre' hook: %s", this.currentQuery.name);
                    this._whichHook = WHICH_HOOK.PRE;
                    return this.currentQuery.pre.call(this, subNext);
                }, () => {
                    this._whichHook = WHICH_HOOK.NONE;
                    // User wants the query to be skipped.
                    if (this._skip) {
                        debug("skipping query");
                        return true;
                    }
                    // User wants to jump to another query
                    if (this._goto) {
                        debug("goto another query");
                        return true;
                    }
                    return false;
                }, next);
            },
        ], (error) => {
            if (error) {
                return done(error);
            }
            if (this._stop || !this.currentQuery) {
                return done(null, null, this.session);
            }
            const question = Object.assign({}, this.currentQuery.question);
            if (this.currentQuery.text) { // convenience
                question.text = this.currentQuery.text;
            }
            if (this._retryText) { // retrying the query
                question.text = this._retryText;
            }
            let choices = question.choices || [];
            if (typeof choices === "function") {
                choices = choices.call(this);
                if (!choices.length) {
                    return done(new errors.ChoiceError("No choices returned from function."));
                }
            }
            const cs = []; // structured choices; for question
            const objs = [question]; // objs requiring i18n; interface { text }
            for (let choice of choices) {
                const c = {
                    id: choice.id || choice,
                    text: choice.text || choice,
                };
                cs.push(c);
                objs.push(c);
            }
            if (cs.length) question.choices = cs;
            return async.each(objs, (obj, next) => {
                if (!this._i18n) return next();
                return this.text(obj.text, this.getAnswers(), (error, text) => {
                    obj.text = text;
                    return next(error);
                });
            }, (error) => {
                if (error) {
                    return done(error);
                }
                this.session.query = this.currentQuery.name;
                if (!question.choices || !question.choices.length) {
                    delete this.session.choices;
                } else if (typeof question.strict === "undefined" || question.strict) {
                    this.session.choices = question.choices.map((c) => c.id);
                }
                return done(null, question, this.session);
            });
        });
    }

    /**
     * Skip the current query.
     * @param  {Function} done
     */
    skip(done) {
        debug("skipping current query");
        assert.ok(done, "Callback must be provided.");
        assert.equal(WHICH_HOOK.PRE, this._whichHook, "QueryController#skip() can only be invoked in 'pre' hooks.");
        this._skip = true;
        return done();
    }

    /**
     * Skip to the query with `name`.
     * @param  {String} name Name of query
     * @param  {Function} done
     */
    goto(name, done) {
        debug("skipping to query: %s", name);
        assert.ok(name, "Name of query must be provided.");
        assert.ok(done, "Callback must be provided.");
        this._goto = name;
        return done();
    }

    /**
     * Retry the current query i.e. do not advance to the next query.
     * This should **ONLY** be used in `post` hooks.
     * @param  {String} [text] Text
     * @param  {Function} done
     */
    retry(text, done) {
        debug("retrying query");
        assert.equal(WHICH_HOOK.POST, this._whichHook, "QueryController#retry() can only be invoked in 'post' hooks.");
        if (!done) {
            done = text;
            text = null;
        }
        assert.ok(done, "Callback must be provided.");
        this._retry = true;
        this._retryText = text;
        return done();
    }

    /**
     * Execute the `post` hook and advance.
     * This should **ONLY** be used in `pre` hooks.
     * @param  {Function} done
     */
    post(done) {
        assert.ok(this.currentQuery, "Invalid state: Current query missing.");
        assert.equal(WHICH_HOOK.PRE, this._whichHook, "QueryController#post() can only be invoked in 'pre' hooks.");
        if (this.currentQuery.post) {
            const beforeState = this._whichHook;
            this._whichHook = WHICH_HOOK.POST;
            return this.currentQuery.post.call(this, this.getAnswer(), (...args) => {
                this._whichHook = beforeState;
                return done(...args);
            });
        }
        return done();
    }

    /**
     * Return the internalized text, if possible.
     * Return `null` if can not be performed.
     * @param  {String} id ID of the i18n text
     * @param  {Object} [ctx] Context to be used in interpolation
     * @param  {Function} done(error, text)
     * @throws {I18nError} if i18n is unavailable.
     */
    text(id, ctx, done) {
        debug("i18n-ing text");
        if (!done) {
            done = ctx;
            ctx = {};
        }
        assert.ok(id, "ID of text must be provided.");
        assert.ok(done, "Callback must be provided.");
        if (!this._i18n) {
            return done(new errors.I18nError("I18n unavailable"));
        }
        return this._i18n(id, ctx, this.ref, done);
    }

    /**
     * Stop processing form at the current query.
     * @param  {Function} done
     */
    stop(done) {
        assert.ok(done, "Callback must be provided.");
        this._stop = true;
        this._index = -1;
        return done();
    }
}


exports = module.exports = QueryController;
