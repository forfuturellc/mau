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
const SessionStore = require("../../../store/base");


describe("SessionStore", function() {
    const store = new SessionStore();
    const isNotImplementedError = (error) => {
        return error.message.indexOf("Not Implemented") !== -1;
    };

    it("is exported as a Function/constructor", function() {
        assert.equal(typeof SessionStore, "function");
    });
    it("sub-classes EventEmitter", function() {
        assert.ok(store instanceof EventEmitter);
    });

    describe("#get()", function() {
        it("throws 'NotImplemented' Error by default", function() {
            try {
                store.get();
                assert.fail("Error not thrown.");
            } catch (ex) {
                assert.ok(isNotImplementedError(ex) , "Wrong error.");
            }
        });
    });

    describe("#put()", function() {
        it("throws 'NotImplemented' Error by default", function() {
            try {
                store.put();
            } catch (ex) {
                assert.ok(isNotImplementedError(ex) , "Wrong error.");
            }
        });
    });

    describe("#del()", function() {
        it("throws an 'NotImplemented' Error by default", function() {
            try {
                store.del();
            } catch (ex) {
                assert.ok(isNotImplementedError(ex) , "Wrong error.");
            }
        });
    });
});
