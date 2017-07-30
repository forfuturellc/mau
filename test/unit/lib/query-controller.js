/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// own modules
const mau = require("../../..");
const Form = require("../../../lib/form");
const QueryController = require("../../../lib/query-controller");
const session = require("../../../lib/session");


describe("QueryController", function() {
    const chatID = 12345;
    let form, sess, ref, controller;

    beforeEach(function() {
        form = new Form("form-name", []);
        sess = session.initialize(chatID, form);
        ref = {};
        controller = new QueryController(form, sess, ref);
    });

    it("is exported as a Function/Constructor", function() {
        assert.equal("function", typeof QueryController);
    });

    it("automatically advances to query if sess.query is set", function() {
        const queryName = "query";
        form.queries = [{ name: queryName }];
        sess.query = queryName;
        controller = new QueryController(form, sess, ref);
        assert.equal(form.queries[0], controller.currentQuery);
    });

    describe("#form", function() {
        it("is provided in constructor()", function() {
            assert.strictEqual(form, controller.form);
        });
    });

    describe("#session", function() {
        it("is provided in constructor()", function() {
            assert.strictEqual(sess, controller.session);
        });
    });

    describe("#ref", function() {
        it("is provided in constructor()", function() {
            assert.strictEqual(ref, controller.ref);
        });
    });

    describe("#getAnswers()", function() {
        it("returns the current answers", function() {
            assert.strictEqual(undefined, controller.getAnswers());
            const options = { answers: {} };
            controller.session = session.initialize(chatID, form, options);
            assert.strictEqual(options.answers, controller.getAnswers());
        });
    });

    describe("#getAnswer()", function() {
        it("returns `undefined` if no answers available yet", function() {
            assert.equal(undefined, controller.session.answers);
            assert.equal(undefined, controller.getAnswer("404"));
        });
        it("return the set answer", function() {
            const key = "key";
            const options = { answers: { [key]: 1 } };
            controller.session = session.initialize(chatID, form, options);
            assert.equal(options.answers.key, controller.getAnswer(key));
        });
        it("throws QueryNotFoundError if current query is not found", function() {
            assert.throws(function() {
                controller.getAnswer();
            }, mau.errors.QueryNotFoundError);
        });
        it("return the set answer of current query", function() {
            const queryName = "query";
            const options = { answers: { [queryName]: 1 } };
            form.queries = [{ name: queryName }];
            sess = session.initialize(chatID, form, options);
            sess.query = queryName;
            controller = new QueryController(form, sess, ref);
            assert.equal(options.answers[queryName], controller.getAnswer(queryName));
        });
    });

    describe("#setAnswer()", function() {
        it("sets the answer", function() {
            const [key, val] = ["key", "val"];
            assert.equal(undefined, controller.getAnswer(key));
            controller.setAnswer(key, val);
            assert.equal(val, controller.getAnswer(key));
        });
        it("throws QueryNotFoundError if current query is not found", function() {
            assert.throws(function() {
                controller.setAnswer("val");
            }, mau.errors.QueryNotFoundError);
        });
        it("sets answer of current query", function() {});
    });

    describe("#advance()", function() {
        const answers = {
            first: "first",
            post: "post",
            retry: "retry",
            "retry-text": "retry-text",
            stop: "stop",
            pre: "pre",
            skip: "skip",
            goto: "goto",
        };
        const queries = [
            {
                name: "first",
                text: "first",
            },
            {
                name: "post",
                text: "post",
                post(answer, done) {
                    assert.ok(this, "context missing in post hook.");
                    assert.equal(answers["post"], answer, "incorrect answer in post hook.");
                    assert.equal(answers["post"], this.getAnswer(), "incorrect answer in post hook.");
                    assert.ok(done, "callback missing in post hook.");
                    return done();
                },
            },
            {
                name: "retry",
                text: "retry",
                post(answer, done) {
                    return this.retry(done);
                },
            },
            {
                name: "retry-text",
                text: "retry-text",
                post(answer, done) {
                    return this.retry(answer.toUpperCase(), done);
                },
            },
            {
                name: "stop",
                text: "stop",
                post(answer, done) {
                    return this.stop(done);
                },
            },
            {
                name: "pre",
                text: "pre",
                pre(done) {
                    assert.ok(this, "context missing in pre hook.");
                    assert.ok(done, "callback missing in pre hook.");
                    assert.equal(undefined, this.getAnswer(), "answer should (not must) be undefined in pre hook.");
                    return done();
                },
            },
            {
                name: "skip",
                text: "skip",
                pre(done) {
                    return this.skip(done);
                },
                post() {
                    assert.fail("post hook invoked after this.skip() in pre hook.");
                },
            },
            {
                name: "goto",
                text: "goto",
                post(answer, done) {
                    return this.goto("goto3", done);
                },
            },
            {
                name: "goto2",
                text: "goto2",
            },
            {
                name: "goto3",
                text: "goto3",
                pre(done) {
                    return this.goto("goto2", done);
                },
                post() {
                    assert.fail("post hook invoked after this.goto() in pre hook");
                },
            },
            {
                name: "goto-bad",
                text: "goto-bad",
                post(answer, done) {
                    return this.goto("404", done);
                },
            },
            {
                name: "choices",
                text: "choices",
                question: {
                    choices: ["yes", "no"],
                    retryText: "retry",
                },
                post(answer, done) { return this.retry(done); },
            },
            {
                name: "choices-unstrict",
                text: "choices-unstrict",
                question: {
                    choices: [{ id: 1, text: "yes" }, { id: 2, text: "no" }],
                    strict: false,
                },
                post(answer, done) { return this.retry(done); },
            },
            {
                name: "choices-fn",
                text: "choices-fn",
                question: {
                    choices: [{ id: 1, text: "yes" }, { id: 2, text: "no" }],
                },
                post(answer, done) { return this.retry(done); },
            },
            {
                name: "i18n",
                text: "i18n",
                question: {
                    choices: [{ id: 1, text: "yes" }, { id: 2, text: "no" }],
                },
                post(answer, done) { return this.retry(done); },
            },
            { name: "end", text: "end" },
        ];
        const getIndex = (name) => queries.findIndex((q) => q.name === name);
        const getAnswer = (index) => answers[queries[index].name];

        beforeEach(function() {
            controller.form.queries = queries;
        });
        it("advances to first query", function(done) {
            controller.advance(null, function(error, question, _sess) {
                assert.ifError(error);
                assert.ok(question);
                assert.equal(queries[0].text, question.text);
                assert.equal(undefined, question.choices);
                assert.ok(_sess);
                assert.equal(queries[0].name, _sess.query);
                assert.equal(undefined, _sess.choices);
                return done();
            });
        });
        it("throws assertion error if session.choices is defined but no current query", function() {
            controller.session.choices = ["yes", "no"];
            assert.throws(function() {
                controller.advance(null, function() {
                    assert.fail("Callback invoked.");
                });
            });
        });
        it("sets answer of current query", function(done) {
            const name = "first";
            const index = getIndex(name);
            controller._index = index;
            controller.advance(answers[name], function(error, question, _sess) {
                assert.ifError(error);
                assert.equal(answers[name], _sess.answers[name]);
                assert.equal(answers[name], controller.getAnswer(name));
                return done();
            });
        });
        it("executes post hook", function(done) {
            const name = "post";
            controller._index = getIndex(name);
            controller.advance(answers[name], function(error) {
                assert.ifError(error);
                return done();
            });
        });
        it("[#retry()] allows retrying query", function(done) {
            const name = "retry";
            controller._index = getIndex(name);
            controller.advance(answers[name], function(error, question, _sess) {
                assert.ifError(error);
                assert.equal(name, _sess.query, "Query changed; retry failed.");
                return done();
            });
        });
        it("[#retry()] allows retrying query with custom text", function(done) {
            const name = "retry-text";
            controller._index = getIndex(name);
            controller.advance(answers[name], function(error, question) {
                assert.ifError(error);
                assert.equal(answers[name].toUpperCase(), question.text, "Retry text unchanged.");
                return done();
            });
        });
        it("[#stop()] allows stopping form processing", function(done) {
            const name = "stop";
            controller._index = getIndex(name);
            controller.advance(answers[name], function(error, question, _sess) {
                assert.ifError(error);
                assert.equal(undefined, question, "Question passed back after stopping.");
                assert.ok(_sess, "Session not passed back after stopping.");
                return done();
            });
        });
        it("executes pre hook", function(done) {
            const name = "pre";
            controller._index = getIndex(name)-1;
            controller.advance(getAnswer(controller._index), function(error) {
                assert.ifError(error);
                return done();
            });
        });
        it("[#skip()] allows skipping current query", function(done) {
            const name = "skip";
            controller._index = getIndex(name)-1;
            controller.advance(getAnswer(controller._index), function(error, question, _sess) {
                assert.ifError(error);
                assert.notEqual(name, _sess.query, "Query not skipped.");
                return done();
            });
        });
        it("[#goto()] allows skipping to another query", function(done) {
            const name = "goto";
            controller._index = getIndex(name);
            controller.advance(answers[name], function(error, question, _sess) {
                assert.ifError(error);
                assert.equal(_sess.query, "goto2", "Goto failed.");
                return done();
            });
        });
        it("[#goto()] throws QueryNotFoundError if query is not found", function(done) {
            const name = "goto-bad";
            controller._index = getIndex(name);
            controller.advance(name, function(error) {
                assert.ok(error instanceof mau.errors.QueryNotFoundError);
                return done();
            });
        });
        it("sets question.choices", function(done) {
            const name = "choices";
            const index = getIndex(name);
            const query = queries[index];
            controller._index = index;
            controller.advance(name, function(error, question, _sess) {
                assert.ifError(error);
                assert.ok(question.choices, "Question has no choices.");
                const [a, b] = question.choices;
                assert.equal(a.text, query.question.choices[0]);
                assert.equal(b.text, query.question.choices[1]);
                assert.ok(_sess);
                return done();
            });
        });
        it("sets session.choices, when question.strict = true (default)", function(done) {
            const name = "choices";
            const index = getIndex(name);
            const query = queries[index];
            controller._index = index;
            controller.advance(name, function(error, question, _sess) {
                assert.ifError(error);
                assert.ok(question.choices, "Question has no choices.");
                assert.ok(_sess.choices, "session.choices not set when question.strict is true.");
                const [a, b] = _sess.choices;
                assert.equal(a, query.question.choices[0]);
                assert.equal(b, query.question.choices[1]);
                return done();
            });
        });
        it("does not sets session.choices, when question.strict = false", function(done) {
            const name = "choices-unstrict";
            const index = getIndex(name);
            controller._index = index;
            controller.advance(name, function(error, question, _sess) {
                assert.ifError(error);
                assert.ok(question.choices, "Question has no choices.");
                assert.equal(_sess.choices, undefined, "session.choices set when question.strict is false.");
                return done();
            });
        });
        it("allows question.choices be a function", function(done) {
            const name = "choices-fn";
            const index = getIndex(name);
            const query = queries[index];
            controller._index = index;
            controller.advance(name, function(error, question) {
                assert.ifError(error);
                assert.ok(question.choices, "Question has no choices.");
                const [a, b] = question.choices;
                assert.equal(a.id, query.question.choices[0].id);
                assert.equal(a.text, query.question.choices[0].text);
                assert.equal(b.id, query.question.choices[1].id);
                assert.equal(b.text, query.question.choices[1].text);
                return done();
            });
        });
        it("retries query if answer is not valid choice", function(done) {
            controller._index = getIndex("choices");
            controller.session.choices = ["yes", "no"];
            controller.advance("404", function(error, question) {
                assert.ifError(error);
                assert.ok(question);
                assert.equal(question.text, "retry", "Wrong retry text.");
                assert.ok(question.choices, "Choices not provided.");
                return done();
            });
        });
        it("[#text()] allows i18n for texts", function(done) {
            const name = "i18n";
            const replacement = "REPLACED:" + name.toUpperCase();
            const index = getIndex(name);
            controller._index = index;
            controller.form.options.i18n = function i18n(id, ctx, ref, done) {
                assert.strictEqual(ref, controller.ref, "Incorrect reference passed.");
                return done(null, replacement);
            };
            controller.advance(name, function(error, question) {
                assert.ifError(error);
                assert.equal(question.text, replacement, "i18n replacement failed for question.text.");
                const [a, b] = question.choices;
                assert.equal(a.text, replacement, "i18n replacement failed for choice.text.");
                assert.equal(b.text, replacement, "i18n replacement failed for choice.text.");
                return done();
            });
        });
    });
});
