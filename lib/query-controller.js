/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// own modules
const assert = require("assert");


// installed modules
const _ = require("lodash");
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
     * @param  {FormSet} formset FormSet
     * @param  {Form} form Form
     * @param  {Session} session Session
     * @param  {Object} ref Reference
     * @throws {QueryNotFoundError} if current query is not found.
     */
    constructor(formset, form, session, ref) {
        assert.ok(formset, "FormSet not provided");
        assert.ok(form, "Form not provided.");
        assert.ok(session, "Session not provided.");
        assert.ok(ref, "Reference not provided.");
        this.formset = formset;
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
        // Manually-set text
        this._setText = null;
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
     * @param  {String} [name] Name of query. This is actually a path.
     * @param  {*} [defaultValue] Default value
     * @return {*} value
     * @throws {QueryNotFoundError} If the current query is not found.
     */
    getAnswer(name, defaultValue) {
        if (!name) name = this._getCurrentQuery().name;
        return _.get(this.session.answers, name, defaultValue);
    }

    /**
     * Set an answer.
     * If `name` is omitted, it sets the answer for the current query.
     * @param  {String} [name] Name of query. This is actually a path.
     * @param  {*} val New value
     * @throws {QueryNotFoundError} if current query is not found.
     */
    setAnswer(name, val) {
        if (!val) {
            val = name;
            name = this._getCurrentQuery().name;
        }
        this.session.answers = this.session.answers || {};
        _.set(this.session.answers, name, val);
        return val;
    }

    /**
     * Unset an answer.
     * If `name` is omitted, it unsets the answer for the current query.
     * @param  {String} [name] Name of query. This is actually a path.
     * @throws {QueryNotFoundError} if current query is not found
     */
    unsetAnswer(name) {
        if (!name) name = this._getCurrentQuery().name;
        return _.unset(this.session.answers, name);
    }

    /**
     * @private
     * Advance the controller.
     * This executes the relevant 'pre' and 'post' hooks.
     * @param  {String} answer Next answer
     * @throws {ChoiceError} if answer is not a valid choice, or
     * choices where not found in question.
     * @throws {QueryNotFoundError} if query is not found.
     */
    async advance(answer) {
        debug("advancing on queries: current-index=%d", this._index);
        // TODO: Assert answer is a string!
        assert.ok(answer || answer === null, "Answer must be provided.");

        if (this.currentQuery) {
            debug("found current query");
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
                    await this.retry(question.retryText);
                }
            }

            if (!this._retry) {
                this.setAnswer(answer);
                if (this.currentQuery.post) {
                    debug("executing current query 'post' hook: %s", this.currentQuery.name);
                    await this.currentQuery.post.call(this, this.getAnswer(this.currentQuery.name));
                }
            }

            this._whichHook = WHICH_HOOK.NONE;
        }

        // Allow retrying current query; `this.retry()` in the post hook above.
        // Allow stopping form processing; `this.stop()` in the post hook above.
        if (!(this._retry || this._stop)) {
            // Finding the next query
            while (true) {
                if (this._goto) {
                    debug("jumping to query: %s", this._goto);
                    const index = this._queries.findIndex((query) => {
                        return query.name === this._goto;
                    });
                    if (index === -1) {
                        throw new errors.QueryNotFoundError(`query not found (query=${this._goto})`);
                    }
                    this._index = index;
                } else {
                    debug("moving to next query");
                    this._index++;
                }

                // Reset state.
                this._goto = null;
                this._skip = false;
                this._setText = null;

                if (!this.currentQuery) {
                    debug("next query missing");
                    break;
                }

                if (!this.currentQuery.pre) {
                    debug("next query lacks 'pre' hook");
                    break;
                }

                debug("executing next query 'pre' hook: %s", this.currentQuery.name);
                this._whichHook = WHICH_HOOK.PRE;
                await this.currentQuery.pre.call(this);
                this._whichHook = WHICH_HOOK.NONE;

                // User wants the query to be skipped.
                if (this._skip) {
                    debug("skipping query");
                    continue;
                }


                // User wants to jump to another query
                if (this._goto) {
                    debug("goto another query");
                    continue;
                }

                break;
            }
        }

        // TODO: Rename returned value from `question` to `query`.

        if (this._stop) {
            debug("stopping form processing");
            return { question: null, session: this.session };
        }

        if (!this.currentQuery) {
            debug("form is finished");
            return { question: null, session: this.session };
        }

        const currentQuestion = Object.assign({
            strict: true,
        }, this.currentQuery.question);
        const query = { 
            text: this._retryText || this._setText || this.currentQuery.text || currentQuestion.text, 
        };
        const choices = []; // structured choices; for query
        const i18nObjs = [query]; // objects requiring i18n; interface { text }

        let rawChoices = [];
        if (typeof currentQuestion.choices === "function") {
            const result = currentQuestion.choices.call(this);
            if (result && result.length) {
                rawChoices = result;
            }
        } else if (currentQuestion.choices && currentQuestion.choices.length) {
            rawChoices = currentQuestion.choices;
        }
        for (let rawChoice of rawChoices) {
            if (typeof rawChoice.when === "function") {
                if (!rawChoice.when.call(this)) {
                    continue;
                }
            }
            const choice = {
                id: rawChoice.id || rawChoice,
                text: rawChoice.text || rawChoice,
            };
            choices.push(choice);
            i18nObjs.push(choice);
        }
        if (choices.length) {
            query.choices = choices;
        }

        if (this._i18n) {
            await Promise.all(i18nObjs.map((async obj => {
                obj.text = await this.text(obj.text, this.getAnswers());
            })));
        }

        // Updating session.
        this.session.query = this.currentQuery.name;
        this.session.text = query.text;
        if (!query.choices) {
            delete this.session.choices;
        } else if (currentQuestion.strict) {
            this.session.choices = query.choices.map((c) => c.id);
        }

        return { question: query, session: this.session };
    }

    /**
     * Skip the current query.
     */
    async skip() {
        debug("skipping current query");
        assert.equal(WHICH_HOOK.PRE, this._whichHook, "QueryController#skip() can only be invoked in 'pre' hooks.");
        this._skip = true;
    }

    /**
     * Skip to the query with `name`.
     * @param  {String} name Name of query
     */
    async goto(name) {
        debug("skipping to query: %s", name);
        assert.ok(name, "Name of query must be provided.");
        this._goto = name;
    }

    /**
     * Retry the current query i.e. do not advance to the next query.
     * This should **ONLY** be used in `post` hooks.
     * @param  {String} [text] Text
     */
    async retry(text) {
        debug("retrying query");
        assert.equal(WHICH_HOOK.POST, this._whichHook, "QueryController#retry() can only be invoked in 'post' hooks.");
        this._retry = true;
        this._retryText = text || this.session.text;
    }

    /**
     * Execute the `post` hook and advance.
     * This should **ONLY** be used in `pre` hooks.
     */
    async post() {
        assert.ok(this.currentQuery, "Invalid state: Current query missing.");
        assert.equal(WHICH_HOOK.PRE, this._whichHook, "QueryController#post() can only be invoked in 'pre' hooks.");
        if (this.currentQuery.post) {
            const beforeState = this._whichHook;
            this._whichHook = WHICH_HOOK.POST;
            await this.currentQuery.post.call(this, this.getAnswer());
            this._whichHook = beforeState;
        }
    }

    /**
     * Return the internalized text, if possible.
     * Return `null` if can not be performed.
     * @param  {String} id ID of the i18n text
     * @param  {Object} [ctx] Context to be used in interpolation
     * @throws {I18nError} if i18n is unavailable.
     */
    async text(id, ctx={}) {
        debug("i18n-ing text");
        assert.ok(id, "ID of text must be provided.");
        if (!this._i18n) {
            throw new errors.I18nError("I18n unavailable");
        }
        return await this._i18n(id, ctx, this.ref);
    }

    /**
     * Stop processing form at the current query.
     */
    async stop() {
        this._stop = true;
        this._index = -1;
    }

    /**
     * Skip to the form with `name`.
     * @param  {String} name Name of form
     * @todo Test this method!
     */
    async do(name) {
        debug("skipping to form: %s", name);
        assert.ok(name, "Name of form must be provided.");
        this.form.once("done", (formset, answers, ref) => {
            formset.processForm(name, this.session.chatID, ref, {
                answers: this.getAnswers(),
            });
        });
        await this.stop();
    }

    /**
     * Send text message.
     * @param  {String} id ID of the i18n text
     * @todo Test this method!
     * @todo Wait for the message to actually be sent! Currently, the
     *  `query` event is fired and we move on without waiting for
     *  the event handler to report status of the sending operation.
     */
    async send(id) {
        debug("sending text message: %s", id);
        const text = await this.text(id, this.getAnswers());
        // TODO: pass callback to `query` event
        // TODO: Refactor to use a formset method instead.
        this.formset.emit("query", { text }, this.ref);
    }

    /**
     * Set the current query's text.
     * @param  {String} id ID of the i18n text
     * @todo Test this method!
     */
    setText(id) {
        debug("setting query's text: %s", id);
        assert.ok(this.currentQuery, "Invalid state: Current query missing.");
        assert.equal(WHICH_HOOK.PRE, this._whichHook, "QueryController#setText() can only be invoked in 'pre' hooks.");
        this._setText = id;
    }
}


exports = module.exports = QueryController;
