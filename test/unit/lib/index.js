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
const constants = require("../../../lib/constants");
const errors = require("../../../lib/errors");
const FormSet = require("../../../lib/formset");


describe("mau", function() {
    describe(".constants", function() {
        it("is exported", function() {
            assert.strictEqual(constants, mau.constants);
        });
    });

    describe(".errors", function() {
        it("is exported", function() {
            assert.strictEqual(errors, mau.errors);
        });
    });

    describe(".FormSet", function() {
        it("is exported", function() {
            assert.strictEqual(FormSet, mau.FormSet);
        });
    });
});
