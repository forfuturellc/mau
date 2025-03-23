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
            _done.wrap(formset.processForm(formName, chatID, ref));
        });
        it("throws FormNotFoundError if form is not found", async function() {
            await assert.rejects(
                formset.processForm("404", chatID, ref),
                error => {
                    assert.ok(error instanceof mau.errors.FormNotFoundError, "Error thrown is not a FormNotFoundError instance.");
                    return true;
                },
            );
        });
        it("throws BusyError if form is already being processed", async function() {
            await formset.processForm(formName, chatID, ref);
            formset.addForm("another", []);
            await assert.rejects(
                formset.processForm("another", chatID, ref),
                error => {
                    assert.ok(error instanceof mau.errors.BusyError, "Error thrown is not a BusyError instance.");
                    return true;
                },
            );
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
            _done.wrap(formset.processForm(formName, chatID, ref));
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
            _done.wrap(formset.process(chatID, "answer", ref));
        });
        it("throws FormNotFoundError if form is not found", async function() {
            formset.options.store = new MemoryStore();
            await assert.rejects(
                formset.process(chatID, "answer", ref),
                error => {
                    assert.ok(error instanceof mau.errors.FormNotFoundError, "Error thrown is not a FormNotFoundError instance.");
                    return true;
                },
            );
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
            _done.wrap(formset.processForm(formName, chatID, ref));
        });
        it("updates session using store", async function() {
            await formset.process(chatID, answer, ref);
            const session = await formset.options.store.get(sid);
            assert.ok(session, "Session not found.");
            assert.equal(session.version, mau.constants.SESSION_VERSION, "Incorrect session version.");
            assert.equal(session.form, formName, "Incorrect form name.");
            assert.equal(session.answers[queries[0].name], answer, "Saved answer not same.");
        });
        it("deletes session if form is complete", async function() {
            const [ form ] = formset.getForms();
            delete form.queries[1];
            await formset.process(chatID, answer, ref);
            const session = await formset.options.store.get(sid);
            assert.ok(!session, "Session found; not destroyed.");
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
            _done.wrap(formset.process(chatID, answer, ref));
        });
        it("throws SessionError if session has different version", async function() {
            const session = await formset.options.store.get(sid);
            assert.ok(session, "Session not found.");
            session.version = mau.constants.SESSION_VERSION + 1;
            await formset.options.store.put(sid, session, {});
            await assert.rejects(
                formset.process(chatID, answer, ref),
                error => {
                    assert.ok(error instanceof mau.errors.SessionError, "Error thrown is not a SessionError instance.");
                    return true;
                },
            );
        });
    });
});


function multiDone(num, done) {
    let todo = num;
    const _done = function(error) {
        assert.ifError(error);
        if (--todo === 0) { done(); }
    };
    _done.wrap = function (promise) {
        promise.then(() => _done()).catch(_done);
    };
    return _done;
}
