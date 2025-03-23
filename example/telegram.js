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
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error("Missing Telegram token");
}
const formset = new mau.FormSet({
    // You can use different session stores, as long as they conform
    // to the SessionStore interface.
    // By default, memory session store is used i.e. stores session
    // objects in process memory, thus NOT scalable to multiple instances.
    store: process.env.NO_REDIS ? undefined : new RedisStore({
        port: process.env.REDIS_PORT,
    }),
    // Time-To-Live: this indicates how long the session should be stored.
    // If the session expires, the form will be lost.
    // By default, the session lives indefinitely. You'll set this
    // to your liking.
    ttl: 1000 * 60 * 5, // in milliseconds.
});
const port = parseInt(process.argv[2], 10);
const opts =  port ?
    { webHook: { host: "127.0.0.1", port } } :
    { polling: true } ;
const bot = new Tgfancy(token, opts);


// A formset holds multiple forms.
// We are adding a new form named 'example'.
formset.addForm("example", [
    // This is a single query named 'name'.
    // We are asking the user for their name.
    {
        name: "name",
        text: "What is your name?",
        // 'post' hook: executed AFTER the user has answered.
        async post(answer) {
            // 'answer' is the answer the user provided.
            // Let's update our answer with a uppercased version.
            this.setAnswer(answer.toUpperCase());
        },
    },
    {
        name: "skipped",
        text: "this should be skipped",
        // 'pre' hook: executed BEFORE the user answers the query.
        async pre() {
            // Let's just place a dummy answer.
            this.setAnswer(true);
            // Skip this query i.e. do NOT send the question.
            // Move to next query.
            await this.skip();
        },
    },
    {
        name: "color",
        question: {
            text: "Pick a color",
            choices: ["black", "white", "gray"],
        },
        async post() {
            // The engine allows you to skip to another query.
            await this.goto("random");
        },
    },
    {
        name: "untouched",
        text: "This will not (and should NOT) be used!",
        async pre() {
            throw new Error("We should NOT be here!!!");
        },
    },
    {
        name: "random",
        text: "Type something random (retries till you answer with 'random')",
        async post(answer) {
            if (answer !== "random") {
                // We can also make the engine retry the query.
                await this.retry("type in 'random'");
            }
        },
    },
], {
    // Specify an *optional* function that will be invoked when the
    // form has been completed by a user.
    cb: answersCb,
});


function answersCb(answers, ref) {
    // 1. 'answers' - Object/hash with the answers.
    // 2. 'ref' - Our object reference; we are providing this later.
    // Notice we are NOT getting an error object! What!!!
    // Well, errors that occur while processing the queries will be
    // passed somewhere else better suited for it.
    // (Keep Reading!)
    return bot.sendMessage(ref.chat.id, [
        "answers:",
        "  name=" + answers.name,
        "  skipped=" + answers.skipped,
        "  color=" + answers.color,
        "  radom=" + answers.random,
    ].join("\n")).catch(error => console.error(error));
}


// The formset emits the "query" event when a question should
// be asked to the user. It is up to YOU to send the query to
// the user (on whichever platform your bot is running on).
formset.on("query", function(question, msg) {
    console.log("[*] new query from formset");
    const opts = {};
    // A question may have choices. Each choice has the interface:
    // 1. `choice.id`:  ID of choice
    // 2. `choice.text`: Text of choice
    // In most cases, you should have your messaging platform present
    // buttons with text set as `choice.text`, and once clicked returns
    // the ID of the clicked button i.e. `choice.id`.
    if (question.choices) {
        opts["reply_markup"] = {
            keyboard: [question.choices.map((c) => c.id)],
            "resize_keyboard": true,
            "one_time_keyboard": true,
        };
    }
    // `question.text` is the actual text that should be sent
    // to user.
    return bot.sendMessage(msg.chat.id, question.text, opts)
        .catch(error => console.error(error));
});


// Receiving messages from users.
bot.on("text", async function(msg) {
    console.log("[*] received new text message: %s", msg.text);

    // A Reference is used to allow you to provide arbitrary data
    // and objects to enable your operations in hooks in the forms,
    // form completion callback, etc. The reference you provide
    // to any of the select functions is passed AS IS to relevant
    // callbacks.
    const ref = msg; // Just the original message object.
    let formNotFound = false;

    try {
        // Have the formset process the message, in the chat identified
        // by the unique ID `msg.chat.id`.
        // Use the message's text `msg.text` as the answer.
        // Our reference i.e. `ref`.
        await formset.process(msg.chat.id, msg.text, ref);
    } catch (error) {
        // A form was not found. You can trigger a certain form be
        // used, as we doing below. You may choose to ask the user to
        // choose for themselves, etc.
        if (error instanceof mau.errors.FormNotFoundError) {
            formNotFound = true;
        } else {
            return console.error(error);
        }
    }

    if (formNotFound) {
        try {
            console.log("[*] triggering the example form");
            await formset.processForm("example", msg.chat.id, msg);
        } catch (error) {
            return console.error(error);
        }
    }
});


console.log("[*] send a message to your bot");
