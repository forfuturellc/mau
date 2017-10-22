/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// built-in modules
const assert = require("assert");


// own modules
const Form = require("../../../lib/form");
const FormSet = require("../../../lib/formset");
const session = require("../../../lib/session");


describe("Form", function() {
    const formset = new FormSet();

    it("is exported as a Function/Constructor", function() {
        assert.equal(typeof Form, "function");
    });

    describe("form#name", function() {
        it("is the name provided to constructor()", function() {
            const name = "form-name";
            const form = new Form(name, []);
            assert.equal(name, form.name);
        });
    });

    describe("form#queries", function() {
        it("is the queries provided to constructor()", function() {
            const queries = [];
            const form = new Form("form-name", queries);
            assert.equal(queries, form.queries);
        });
    });

    describe("form#options", function() {
        it("is the options provided to constructor()", function() {
            const options = {};
            const form = new Form("form-name", [], options);
            assert.strictEqual(options, form.options);
        });
    });

    describe("form#process()", function() {
        it("processes queries", function(done) {
            const ref = {};
            const form = new Form("form-name", [
                {
                    name: "hello",
                    text: "hello",
                    pre(done) {
                        assert.strictEqual(this.ref, ref, "Incorrect reference.");
                        return done();
                    },
                },
            ]);
            const sess = session.initialize(12345, form);
            return form.process(formset, sess, "world", ref, function(error, question, updatedSession) {
                assert.ifError(error);
                assert.ok(question);
                assert.ok(updatedSession);
                return done();
            });
        });
    });
});
