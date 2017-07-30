/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 *
 * @module errors
 */


// built-in modules
const assert = require("assert");


exports.BaseError = class BaseError extends Error {
    /**
     * @private
     * @class BaseError
     * @constructor
     * @param  {String} code Error code
     * @param  {String} message Error message
     */
    constructor(code, message) {
        assert.ok(code, "Error code must be provided.");
        assert.ok(message, "Error message must be provided.");
        const error = message instanceof Error ? message : null;
        message = error ? error.message : message;
        super(`${code}: ${message}`);
        this.code = code;
        if (error) this.stack = error.stack;
    }
};


exports.BusyErrorCode = "EBUSY";
exports.BusyError = class BusyError extends exports.BaseError {
    /**
     * Object busy doing something already.
     * Usually thrown when a form is already being processed.
     * Error code is `"EBUSY"`.
     * @class BusyError
     * @constructor
     * @param  {String|Error} [message]
     */
    constructor(message="Busy") {
        super(exports.BusyErrorCode, message);
    }
};


exports.FormNotFoundErrorCode = "ENOFORM";
exports.FormNotFoundError = class FormNotFoundError extends exports.BaseError {
    /**
     * Form not found.
     * Error code is `"ENOFORM"`.
     * @class FormNotFoundError
     * @constructor
     * @param  {String|Error} [message] If string, should be name of form.
     */
    constructor(message) {
        if (typeof message === "string") {
            message = `${message}: form not found`;
        } else if (!message) {
            message = "form not found";
        }
        super(exports.FormNotFoundErrorCode, message);
    }
};


exports.I18nErrorCode = "EI18N";
exports.I18nError = class I18nError extends exports.BaseError {
    /**
     * Error occurred during internationalization.
     * Error code is `"E18N"`;
     * @class I18nError
     * @constructor
     * @param  {String|Error} [message]
     */
    constructor(message="I18n failed") {
        super(exports.I18nErrorCode, message);
    }
};


exports.QueryNotFoundErrorCode = "ENOQUERY";
exports.QueryNotFoundError = class QueryNotFoundError extends exports.BaseError {
    /**
     * Query not found in form.
     * Error code is `"ENOQUERY"`.
     * @class QueryError
     * @constructor
     * @param  {String|Error} [message]
     */
    constructor(message="Query not found") {
        super(exports.QueryNotFoundErrorCode, message);
    }
};


exports.SessionErrorCode = "ESESS";
exports.SessionError = class SessionError extends exports.BaseError {
    /**
     * Session error.
     * Error code is `"ESESS"`.
     * @class SessionError
     * @constructor
     * @param  {String|Error} [message]
     */
    constructor(message="Session error") {
        super(exports.SessionErrorCode, message);
    }
};
