/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 *
 * Demonstrating using the Query Engine to process queries in
 * a Telegram Bot.
 */
/* eslint-disable no-console */


// installed modules
const mau = require("..");
const RedisStore = require("../store/redis");
const Tgfancy = require("tgfancy");


// module variables
const formset = new mau.FormSet({
    // You can use different session stores, as long as they conform
    // to the SessionStore interface.
    // By default, memory session store is used i.e. stores session
    // objects in process memory, thus NOT scalable to multiple instances.
    store: new RedisStore(),
    // Time-To-Live: this indicates how long the session should be stored.
    // If the session expires, the form will be lost.
    // By default, the session lives infinitely. You'll set this
    // to your liking.
    ttl: 1000 * 60,
});
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error("Missing Telegram token");
}
const port = parseInt(process.argv[2], 10);
const opts =  port ?
    { webHook: { host: "127.0.0.1", port } } :
    { polling: true } ;
const bot = new Tgfancy(token, opts);


// A formset can hold multiple forms.
// We are adding a new form named 'example', that will be triggered
// when the provided regexp evaluates to true. (This triggering will
// become clearer later. Live by faith, my friend!)
formset.addForm("example", /\/example/, [
    // This is a single query named 'name'.
    {
        name: "name",
        text: "what is your name? (will be capitalized)",
        // 'post' hook: executed AFTER the user has answered.
        post(done) {
            // We are retrieving the answer the user has passed us.
            const answer = this.getAnswer();
            // Let's update our answer with a uppercased version.
            this.setAnswer(answer.toUpperCase());
            // ALWAYS invoke the callback (directly or indirectly;
            // keep reading for now). It allows you to do
            // async operations in the hook.
            return done();
        },
    },
    {
        name: "skipped",
        text: "this should be skipped",
        // 'pre' hook: executed BEFORE the user answers the query.
        pre(done) {
            this.setAnswer(true);
            // You can also have the engine skip the query.
            // Notice that we are passing in the callback (`done`) to
            // `this.skip()`! Therefore you do NOT need to invoke `done()`.
            return this.skip(done);
        },
    },
    {
        name: "color",
        query: {
            text: "Pick a color",
            choices: ["red", "green"],
        },
    },
    {
        name: "random",
        text: "type something random (retries till you answer with 'random')",
        post(done) {
            const answer = this.getAnswer();
            if (answer !== "random") {
                // We can also make the engine retry the query.
                // Also, here we pass in the callback (`done`).
                return this.retry(done);
            }
            return done();
        },
    },
], function(answers, msg) {
    // 'answers': Object/hash with the answers
    // 'msg': Message 'object'
    // Notice we are NOT getting an error object! What!!!
    // Well, errors that occur while processing the queries will be
    // passed somewhere else better suited for it.
    // (Keep Reading!)
    return bot.sendMessage(msg.chat.id, [
        "answers:",
        "  name=" + answers.name,
        "  skipped=" + answers.skipped,
        "  color=" + answers.color,
        "  radom=" + answers.random,
    ].join("\n"));
});


formset.on("query", function(query, msg) {
    console.log("[*] new query from formset");
    const opts = {};
    if (query.choices) {
        opts["reply_markup"] = {
            keyboard: [query.choices],
            "resize_keyboard": true,
            "one_time_keyboard": true,
        };
    }
    return bot.sendMessage(msg.chat.id, query.text, opts);
});


bot.on("text", function(msg) {
    console.log("[*] received new text message: %s", msg.text);

    // Have the formset process the message, in the chat identified
    // by the unique ID `msg.chat.id`. Use the message's text `msg.text`
    // to test against the regular expressions accompanying each
    // form. The 'msg' is mostly for convenience; it is passed to
    // the form's callback (as seen above).
    return formset.process(msg.chat.id, msg.text, msg, onProcess);

    function onProcess(error) {
        if (error) {
            if (error.code === "ENOENT") {
                console.log("[*] triggering the example form");
                return formset.processForm("example", msg.chat.id, msg, onSelectFormProcess);
            }
            return console.error(error);
        }
    }
    function onSelectFormProcess(error) {
        if (error) {
            return console.error(error);
        }
    }
});
