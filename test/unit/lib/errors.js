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


describe("errors", function() {
    it("is exported as an Object", function() {
        assert.equal(typeof mau.errors, "object");
    });

    describe(".BaseError", function() {
        const code = "ECODE";
        const message = "Error Message";
        const error = new mau.errors.BaseError(code, message);
        it("is a constructor", function() {
            assert.equal("function", typeof mau.errors.BaseError, "Not a function.");
            assert.ok(error instanceof mau.errors.BaseError, "Not an instance.");
        });
        it("#code is provided in constructor()", function() {
            assert.equal(code, error.code);
        });
        it("#message is determined from code and message(String) in constructor()", function() {
            assert.equal(`${code}: ${message}`, error.message);
        });
        it("#message is determined from code and message(Error) in constructor()", function() {
            const original = new Error("Original Error");
            const error = new mau.errors.BaseError(code, original);
            assert.equal(`${code}: ${original.message}`, error.message);
        });
        it("#stack is copied from message(Error) in constructor()", function() {
            const original = new Error("Original Error");
            const error = new mau.errors.BaseError(code, original);
            assert.strictEqual(original.stack, error.stack);
        });
        it("sub-classes Error", function() {
            assert.ok(error instanceof Error);
        });
    });

    describe(".BusyError", function() {
        const error = new mau.errors.BusyError();
        it("sub-classes BaseError", function() {
            assert.ok(error instanceof mau.errors.BusyError);
        });
        it(`#code equals ${mau.errors.BusyErrorCode}`, function() {
            assert.ok(mau.errors.BusyErrorCode, "Error code missing.");
            assert.equal(mau.errors.BusyErrorCode, error.code);
        });
    });

    describe(".FormNotFoundError", function() {
        const error = new mau.errors.FormNotFoundError();
        it("sub-classes BaseError", function() {
            assert.ok(error instanceof mau.errors.FormNotFoundError);
        });
        it(`#code equals ${mau.errors.FormNotFoundErrorCode}`, function() {
            assert.ok(mau.errors.FormNotFoundErrorCode, "Error code missing.");
            assert.equal(mau.errors.FormNotFoundErrorCode, error.code);
        });
    });

    describe(".I18nError", function() {
        const error = new mau.errors.I18nError();
        it("sub-classes BaseError", function() {
            assert.ok(error instanceof mau.errors.BaseError);
        });
        it(`#code equals ${mau.errors.I18nErrorCode}`, function() {
            assert.ok(mau.errors.I18nErrorCode, "Error code missing.");
            assert.equal(mau.errors.I18nErrorCode, error.code);
        });
    });

    describe(".QueryNotFoundError", function() {
        const error = new mau.errors.QueryNotFoundError();
        it("sub-classes BaseError", function() {
            assert.ok(error instanceof mau.errors.BaseError);
        });
        it(`#code equals ${mau.errors.QueryNotFoundErrorCode}`, function() {
            assert.ok(mau.errors.QueryNotFoundErrorCode, "Error code missing.");
            assert.equal(mau.errors.QueryNotFoundErrorCode, error.code);
        });
    });

    describe(".SessionError", function() {
        const error = new mau.errors.SessionError();
        it("sub-classes BaseError", function() {
            assert.ok(error instanceof mau.errors.BaseError);
        });
        it(`#code equals ${mau.errors.SessionErrorCode}`, function() {
            assert.ok(mau.errors.SessionErrorCode, "Error code missing.");
            assert.equal(mau.errors.SessionErrorCode, error.code);
        });
    });
});
