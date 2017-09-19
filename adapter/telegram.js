/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 */


// installed modules
const Debug = require("debug");
const mau = require("..");
const Tgfancy = require("tgfancy");


// own modules
const Adapter = require("./base");


// module variables
const debug = Debug("mau:adapter:telegram");
const noop = function() {};


class TelegramAdapter extends Adapter {
    /**
     * @constructor
     * @param  {FormSet} formset Associated formset
     * @param  {Object} options Options passed to `new Tgfancy()` (except `options.client`)
     * @param  {String} options.token Telegram token
     * @param  {Tgfancy} options.client Existing Telegram client (no *other* options should be provided)
     * @see https://github.com/GochoMugo/tgfancy
     */
    constructor(formset, options) {
        super(formset, options);
        if (options.client) {
            this.client = options.client;
        } else {
            const token = options.token;
            delete options.token;
            this.client = new Tgfancy(token, options);
            this.client.on("text", (message) => {
                this.processMessage(message, noop);
            });
        }
    }

    /**
     * Process Telegram message.
     * @param  {Object} message Message from Telegram
     * @param  {Function} done Callback(error)
     */
    processMessage(message, done) {
        if (message.chat.type !== "private") {
            debug("ignoring message *not* from a private chat");
            return done(null);
        }
        const text = message.text;
        if (!text) {
            debug("ignoring non-text message");
            return done(null);
        }
        const chatId = message.chat.id;

        return getChoice(this.formset.store, chatId, text, (error, answer) => {
            if (error) {
                debug("error retrieving choice from store");
                return done(error);
            }
            const ref = {
                chatId,
            };
            return this.formset.process(chatId, answer, ref, (error) => {
                if (error && error instanceof mau.errors.FormNotFoundError) {
                    this.emit("unhandledMessage", chatId, text);
                    return done(null);
                }
                return done(error);
            });
        });
    }

    handleQuery(chatId, query) {
        const opts = {};
        if (query.choices) {
            opts["reply_markup"] = {
                keyboard: [query.choices.map((c) => c.id)],
                "resize_keyboard": true,
                "one_time_keyboard": true,
            };
        }

        return storeChoices(this.formset.store, chatId, query.choices, (error) => {
            if (error) {
                this.emit("error", error);
                return;
            }
            return this.client.sendMessage(chatId, query.text, opts);
        });
    }
}


function storeChoices(store, chatId, choices, done) {
    const key = `choices:${chatId}`;

    if (!choices) {
        return store.del(key, done);
    }
    return store.set(key, JSON.stringify(choices), done);
}


function getChoice(store, chatId, answer, done) {
    const key = `choices:${chatId}`;

    return store.get(key, function(error, data) {
        if (error) {
            return done(error);
        }
        if (!data) {
            return done(null, answer);
        }
        let choices;
        try {
            choices = JSON.parse(data);
        } catch (ex) {
            return done(ex);
        }
        // TODO: use a probabilistic model to ensure small
        // changes to the answer still resolve to the correct
        // choice.
        const choice = choices.find(function(choice) {
            return choice.text === answer;
        });
        return done(null, choice ? choice.id : answer);
    });
}


exports = module.exports = TelegramAdapter;
