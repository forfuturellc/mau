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
     * @param  {Array} queries Array of queries
     * @param  {Object} answers Reference to an answers object
     * @param  {Object} form Form
     * @param  {Object} ref Reference
     */
    constructor(queries, answers, form, ref) {
        this.queries = queries;
        this.answers = answers;
        this.form = form;
        this.ref = ref;
        this._index = -1;
        this._skip = false;
        this._retry = false;
    }

    /**
     * Sets the index of the controller.
     * Setting index to -1 allows controller to advance to the first
     * query.
     * @param  {Number} index
     */
    setIndex(index) {
        this._index = index;
    }

    /**
     * Retrieve the current index.
     * @return {Number} current index
     */
    getIndex() {
        return this._index;
    }

    /**
     * Advance the controller.
     * This executes the relevant 'pre' and 'post' hooks.
     * @param  {Function} done(error)
     */
    advance(done) {
        debug("advancing on queries");
        const _this = this;
        const currentQuery = this.queries[this._index];
        let nextQuery;

        return async.series([
            function(next) {
                if (!currentQuery || !currentQuery.post) {
                    debug("current query is missing or lacks 'post' hook");
                    return next();
                }
                debug("executing current query 'post' hook: %s", currentQuery.name);
                return currentQuery.post.call(_this, _this.getAnswer(currentQuery.name), next);
            },
            function(next) {
                if (_this._retry) {
                    debug("retrying; skipping resolving to next query");
                    return next();
                }
                return async.doWhilst(function(subNext) {
                    if (typeof _this._skip === "string") {
                        _this._index = _this.queries.findIndex((q) => {
                            return q.name === _this._skip;
                        });
                        if (_this._index === -1) {
                            return subNext(new Error("skip: missing query"));
                        }
                    } else {
                        _this._index++;
                    }
                    nextQuery = _this.queries[_this._index];
                    _this._skip = false;
                    if (!nextQuery || !nextQuery.pre) {
                        debug("next query missing or lacks 'pre' hook");
                        return subNext();
                    }
                    debug("executing next query 'pre' hook: %s", nextQuery.name);
                    return nextQuery.pre.call(_this, subNext);
                }, function() {
                    return _this._skip !== false;
                }, next);
            },
        ], done);
    }

    /**
     * Retrieve an answer.
     * If 'name' is omitted, it returns answer for the current query.
     * @param  {String} [name] Name of query
     * @return {String} value
     */
    getAnswer(name) {
        name = name || this.queries[this._index].name;
        return this.answers[name];
    }

    /**
     * Set an answer.
     * If 'name' is omitted, it sets the answer for the current query.
     * @param  {String} [name] Name of query
     * @param  {*} val New value
     */
    setAnswer(name, val) {
        if (!val) {
            val = name;
            name = this.queries[this._index].name;
        }
        this.answers[name] = val;
        return val;
    }

    /**
     * Skip the current query i.e. do not send the message.
     * This should *ONLY* be used in 'pre' hooks!
     * @param  {Function} done
     */
    skip(done) {
        debug("skipping query");
        this._skip = true;
        return done();
    }

    skipTo(name, done) {
        debug("skipping to query: %s", name);
        this._skip = name;
        return done();
    }

    /**
     * Retry the current query i.e. do not advance to the next query.
     * This should *ONLY* be used in 'post' hooks.
     * @param  {Function} done
     */
    retry(done) {
        debug("retrying query");
        this._retry = true;
        return done();
    }

    retry(id, done) {
        debug("retrying query");
        this._retry = id;
        return done();
    }

    isRetry() {
        return this._retry !== false;
    }

    text(id, args) {
        return this.form.options.i18n(id, args, this.ref);
    }
}


exports = module.exports = QueryController;
