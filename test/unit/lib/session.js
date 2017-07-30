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
const session = require("../../../lib/session");


describe("session", function() {
    const chatID = 12345;
    const form = new Form("form", []);

    describe(".initialize()", function() {
        it("returns new session", function() {
            const sess = session.initialize(chatID, form);
            assert.equal(mau.constants.SESSION_VERSION, sess.version, "Incorrect version.");
            assert.equal(chatID, sess.chatID, "Incorrect ID.");
            assert.equal(form.name, sess.form, "Incorrect form name.");
            assert.equal(undefined, sess.query, "Query is not undefined.");
            assert.equal(undefined, sess.choices, "Choices is not undefined.");
            assert.equal(undefined, sess.answers, "Answers is not undefined.");
        });
        it("allows initial answers to be provided", function() {
            const options = { answers: {} };
            const sess = session.initialize(chatID, form, options);
            assert.strictEqual(options.answers, sess.answers);
        });
    });
});
