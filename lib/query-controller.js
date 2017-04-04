/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const async = require("async");
const Debug = require("debug");


// module variables
const debug = Debug("mau:query-controller");


/** QueryController Class */
class QueryController {
    /**
     * @constructor
     * @param  {Object} form Form
     * @param  {Object} answers Reference to an answers object
     * @param  {Object} ref Reference
     */
    constructor(form, answers, ref) {
        this.form = form;
        this.answers = answers;
        this.ref = ref;
        this._queries = this.form.queries;
        this._index = -1;
        this._skip = false;
        this._skipTo = null;
        this._stop = false;
        this._retry = false;
        this._retryText = null;
    }

    /**
     * Sets the index of the controller.
     * Setting index to -1 allows controller to advance to the first
     * query.
     * @private
     * @param  {Number} index
     */
    _setIndex(index) {
        this._index = index;
    }

    /**
     * Retrieve the current index.
     * @private
     * @return {Number} current index
     */
    _getIndex() {
        return this._index;
    }

    /**
     * Advance the controller.
     * This executes the relevant 'pre' and 'post' hooks.
     * @private
     * @param  {Function} done(error)
     */
    _advance(done) {
        debug("advancing on queries: current-index=%d", this._index);
        const _this = this;
        const currentQuery = this._queries[this._index];
        let nextQuery;

        return async.series([
            // Execute the 'post' hook, if possible
            function(next) {
                if (!currentQuery || !currentQuery.post) {
                    debug("current query is missing or lacks 'post' hook");
                    return next();
                }
                debug("executing current query 'post' hook: %s", currentQuery.name);
                return currentQuery.post.call(_this, _this.getAnswer(currentQuery.name), next);
            },
            function(next) {
                // Allow retrying current query, or stopping the
                // flow from a 'post' hook
                if (_this._retry) {
                    debug("retrying; skipping resolving to next query");
                    return next();
                }
                if (_this._stop) {
                    debug("stopping form processing at query '%s'", currentQuery.name);
                    return next();
                }
                // Executing the 'pre' hooks, allowing skipping
                return async.doWhilst(function(subNext) {
                    if (_this._skipTo) {
                        _this._index = _this._queries.findIndex((q) => {
                            return q.name === _this._skipTo;
                        });
                        if (_this._index === -1) {
                            return subNext(new Error(`eskip: missing query '${_this._skipTo}'`));
                        }
                    } else {
                        _this._index++;
                    }
                    _this._skip = false;
                    _this._skipTo = null;
                    nextQuery = _this._queries[_this._index];
                    if (!nextQuery || !nextQuery.pre) {
                        debug("next query missing or lacks 'pre' hook");
                        return subNext();
                    }
                    debug("executing next query 'pre' hook: %s", nextQuery.name);
                    return nextQuery.pre.call(_this, subNext);
                }, function() {
                    // We move to next query if we have been asked to
                    // perform a skip, and we have a query!
                    return !_this._stop && _this._skip && nextQuery;
                }, next);
            },
        ], function(error) {
            const i18n = _this.form.options.i18n;
            if (error) {
                if (typeof error === "string") {
                    let msg = error;
                    if (i18n) msg = i18n(error, null, _this.ref);
                    return done(new Error(msg));
                }
                return done(error);
            }
            if (!nextQuery || _this._stop) {
                return done();
            }
            const question = Object.assign({}, nextQuery.question);
            if (_this._retryText) {
                question.text = _this._retryText;
            } else if (nextQuery.text) {
                question.text = nextQuery.text;
            }
            if (i18n && question.text) {
                question.text = i18n(question.text, null, _this.ref);
            }
            if (question.choices) {
                const choices = [];
                let raw = question.choices;
                if (typeof question.choices === "function") {
                    raw = question.choices.call(_this);
                }
                for (let idx = 0; idx < raw.length; idx++) {
                    const choice = raw[idx];
                    const id = choice.id || choice;
                    let text = choice.text || choice;
                    if (i18n) text = i18n(text, null, _this.ref),
                    choices.push({ id, text });
                }
                question.choices = choices;
            }
            return done(null, question, nextQuery);
        });
    }

    /**
     * Retrieve an answer.
     * If `name` is omitted, it returns answer for the current query.
     * @param  {String} [name] Name of query
     * @return {*} value
     */
    getAnswer(name) {
        name = name || this._queries[this._index].name;
        return this.answers[name];
    }

    /**
     * Retrieve an object/hash containing all the answers.
     * @return {Object} answers
     */
    getAnswers() {
        return this.answers;
    }

    /**
     * Set an answer.
     * If `name` is omitted, it sets the answer for the current query.
     * @param  {String} [name] Name of query
     * @param  {*} val New value
     */
    setAnswer(name, val) {
        if (!val) {
            val = name;
            name = this._queries[this._index].name;
        }
        this.answers[name] = val;
        return val;
    }

    /**
     * Skip the current query.
     * @param  {Function} done
     */
    skip(done) {
        debug("skipping query");
        this._skip = true;
        return done();
    }

    /**
     * Skip to the query with `name`.
     * @param  {String} name Name of query
     * @param  {Function} done
     */
    skipTo(name, done) {
        debug("skipping to query: %s", name);
        this._skip = true;
        this._skipTo = name;
        return done();
    }

    /**
     * Retry the current query i.e. do not advance to the next query.
     * This should **ONLY** be used in `post` hooks.
     * @param  {String} [text] Text
     * @param  {Function} done
     */
    retry(text, done) {
        if (!done) {
            done = text;
            text = null;
        }
        debug("retrying query");
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
        const query = this._queries[this._index];
        if (query.post) {
            return query.post.call(this, this.getAnswer(query.name), done);
        }
        return done();
    }

    /**
     * Return the internalized text, if possible.
     * Return `null` if can not be performed.
     * @param  {String} id ID of the i18n text
     * @param  {Object} ctx Context to be used in interpolation
     * @return {String|null}
     */
    text(id, args) {
        if (!this.form.options.i18n) return null;
        return this.form.options.i18n(id, args, this.ref);
    }

    /**
     * Stop processing form at the current query.
     * @param  {Function} done
     */
    stop(done) {
        this._stop = true;
        this._index = -1;
        return done();
    }
}


exports = module.exports = QueryController;
