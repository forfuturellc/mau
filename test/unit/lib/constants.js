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


describe("constants", function() {
    it("is exported as an Object", function() {
        assert.equal(typeof mau.constants, "object");
    });

    describe("constants.SESSION_VERSION", function() {
        it("is a number", function() {
            assert.equal(typeof mau.constants.SESSION_VERSION, "number");
        });
    });
});
