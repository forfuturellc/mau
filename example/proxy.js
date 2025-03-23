/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke>
 * Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>
 *
 * This allows demonstrating scalability of the query engine.
 * This is simply a proxy that passes webhook messages to different
 * Telegram bot instances.
 */
/* eslint-disable no-console */


// built-in modules
const http = require("http");


// installed modules
const httpProxy = require("http-proxy");
const ngrok = require("ngrok");
const Tgfancy = require("tgfancy");


// module variables
const token = process.env.TELEGRAM_TOKEN;
if (!token) {
    throw new Error("Missing telegram token");
}
const proxy = httpProxy.createProxy();
const port = parseInt(process.env.PROXY_PORT, 10) || 9100;
const botPorts = (process.argv[2] || "").split(",");
if (!botPorts[0]) {
    throw new Error("No bots to proxy to");
}
const server = http.Server(requestListener);
const bot = new Tgfancy(token);
let index = 0;


console.log("[*] opening a ngrok tunnel");
ngrok.connect(port).then(function(url) {
    console.log("[*] setting Telegram bot webhook to %s", url);
    return bot.setWebHook(`${url}/bot${token}`);
}).catch(error => { throw error; });


function requestListener(req, res) {
    const botPort = botPorts[index];
    if (++index === botPorts.length) index = 0;
    console.log("[*] proxying to port %s", botPort);
    return proxy.web(req, res, {
        target: `http://0.0.0.0:${botPort}`,
    });
}


server.listen(port, function() {
    console.log("[*] proxy listening on port %d", port);
});
