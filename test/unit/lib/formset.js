/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");
const EventEmitter = require("events");


// own modules
const mau = require("../../..");
const Form = require("../../../lib/form");
const MemoryStore = require("../../../store/memory");


describe("FormSet", function() {
    it("is exported as a Function/Constructor", function() {
        assert.equal(typeof mau.FormSet, "function");
    });
    it("sub-classes EventEmitter", function() {
        const formset = new mau.FormSet();
        assert.ok(formset instanceof EventEmitter);
    });

    describe("#options", function() {
        it("is the options provided to constructor()", function() {
            const options = {};
            const formset = new mau.FormSet(options);
            assert.strictEqual(options, formset.options);
        });
        it(".prefix defaults to 'form:'", function() {
            const formset = new mau.FormSet();
            assert.equal("form:", formset.options.prefix);
        });
        it(".store defaults to a new memory store", function() {
            const formset = new mau.FormSet();
            assert.ok(formset.options.store instanceof MemoryStore);
            const formset2 = new mau.FormSet();
            assert.notStrictEqual(formset.options.store, formset2.options.store, "Same memory store reused.");
        });
        it(".ttl defaults to +Infinity", function() {
            const formset = new mau.FormSet();
            assert.equal(+Infinity, formset.options.ttl);
        });
    });

    describe("#addForm()", function() {
        let formset;

        beforeEach(function() {
            formset = new mau.FormSet();
        });
        it("[#getForms()] adds form", function() {
            let forms = formset.getForms();
            assert.equal(forms.length, 0);
            formset.addForm("name", []);
            forms = formset.getForms();
            assert.ok(forms.length);
        });
        it("returns the added form", function() {
            const form = formset.addForm("name", []);
            assert.ok(form instanceof Form);
        });
    });

    describe("#processForm()", function() {
        // TODO: de-dup this init code! Keep it DRY!
        const formName = "form";
        const queries = [
            {
                name: "query",
                text: "query text",
            },
        ];
        const chatID = "12345";
        const ref = {};
        let formset;

        beforeEach(function() {
            formset = new mau.FormSet();
            formset.addForm(formName, queries);
        });
        it("[#on('query')] processes query", function(done) {
            const _done = multiDone(2, done);
            formset.on("query", function(query, _ref) {
                assert.ok(query, "Query not passed.");
                assert.equal(query.text, queries[0].text, "Incorrect query text.");
                assert.ok(_ref, "Reference not passed.");
                assert.strictEqual(_ref, ref, "Incorrect reference passed.");
                return _done();
            });
            formset.processForm(formName, chatID, ref, function() {
                return _done();
            });
        });
        it("throws FormNotFoundError if form is not found", function(done) {
            formset.processForm("404", chatID, ref, function(error) {
                assert.ok(error, "Error not thrown.");
                assert.ok(error instanceof mau.errors.FormNotFoundError, "Error thrown is not a FormNotFoundError instance.");
                return done();
            });
        });
        it("throws BusyError if form is already being processed", function(done) {
            const _done = multiDone(2, done);
            formset.processForm(formName, chatID, ref, _done);
            formset.addForm("another", []);
            formset.processForm("another", chatID, ref, function(error) {
                assert.ok(error, "Error not thrown.");
                assert.ok(error instanceof mau.errors.BusyError, "Error thrown is not a BusyError instance.");
                return _done();
            });
        });
    });

    describe("#process()", function() {
        // TODO: de-dup this init code! Keep it DRY!
        const formName = "form";
        const queries = [
            {
                name: "query #1",
                text: "query text #1",
            },
            {
                name: "query #2",
                text: "query text #2",
            },
        ];
        const chatID = "12345";
        const ref = {};
        let formset;

        beforeEach(function(done) {
            const _done = multiDone(2, done);
            formset = new mau.FormSet();
            formset.addForm(formName, queries);
            formset.on("query", () => _done());
            formset.processForm(formName, chatID, ref, () => _done());
        });
        it("[#on('query')] processes query", function(done) {
            const _done = multiDone(2, done);
            formset.on("query", function(query, _ref) {
                assert.ok(query, "Query not passed.");
                assert.equal(query.text, queries[1].text, "Incorrect query text.");
                assert.ok(_ref, "Reference not passed.");
                assert.strictEqual(_ref, ref, "Incorrect reference passed.");
                return _done();
            });
            formset.process(chatID, "answer", ref, _done);
        });
        it("throws FormNotFoundError if form is not found", function(done) {
            formset.options.store = new MemoryStore();
            formset.process(chatID, "answer", ref, function(error) {
                assert.ok(error, "Error not thrown.");
                assert.ok(error instanceof mau.errors.FormNotFoundError, "Error thrown is not a FormNotFoundError instance.");
                return done();
            });
        });
    });

    describe("#_process()", function() {
        // TODO: de-dup this init code! Keep it DRY!
        const formName = "form";
        const queries = [
            {
                name: "query #1",
                text: "query text #1",
            },
            {
                name: "query #2",
                text: "query text #2",
            },
        ];
        const chatID = "12345";
        const ref = {};
        const answer = "answer";
        let formset;
        let sid;

        beforeEach(function(done) {
            const _done = multiDone(2, done);
            formset = new mau.FormSet();
            sid = formset._prefix(chatID);
            formset.addForm(formName, queries);
            formset.on("query", () => _done());
            formset.processForm(formName, chatID, ref, () => _done());
        });
        it("updates session using store", function(done) {
            formset.process(chatID, answer, ref, function() {
                formset.options.store.get(sid, (error, session) => {
                    assert.ifError(error);
                    assert.ok(session, "Session not found.");
                    assert.equal(session.version, mau.constants.SESSION_VERSION, "Incorrect session version.");
                    assert.equal(session.form, formName, "Incorrect form name.");
                    assert.equal(session.answers[queries[0].name], answer, "Saved answer not same.");
                    return done();
                });
            });
        });
        it("deletes session if form is complete", function(done) {
            const [ form ] = formset.getForms();
            delete form.queries[1];
            formset.process(chatID, answer, ref, function(error) {
                assert.ifError(error);
                formset.options.store.get(sid, (error, session) => {
                    assert.ifError(error);
                    assert.ok(!session, "Session found; not destroyed.");
                    return done();
                });
            });
        });
        it("invokes the form completion callback if done", function(done) {
            const _done = multiDone(2, done);
            const [ form ] = formset.getForms();
            delete form.queries[1];
            form.options.cb = function(answers, _ref) {
                assert.ok(answers, "Answers not passed.");
                assert.strictEqual(_ref, ref, "Incorrect reference passed.");
                return _done();
            };
            formset.process(chatID, answer, ref, _done);
        });
        it("throws SessionError if session has different version", function(done) {
            formset.options.store.get(sid, (error, session) => {
                assert.ifError(error);
                assert.ok(session, "Session not found.");
                session.version = mau.constants.SESSION_VERSION + 1;
                return storeSession(session);
            });
            function storeSession(session) {
                formset.options.store.put(sid, session, {}, function(error) {
                    assert.ifError(error);
                    return processForm();
                });
            }
            function processForm() {
                formset.process(chatID, answer, ref, function(error) {
                    assert.ok(error, "Error not thrown.");
                    assert.ok(error instanceof mau.errors.SessionError, "Error thrown is not a SessionError instance.");
                    return done();
                });
            }
        });
    });
});


function multiDone(num, done) {
    let todo = num;
    return function(error) {
        assert.ifError(error);
        if (--todo === 0) { done(); }
    };
}
