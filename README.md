# mau

<img align="right"
     alt="The Dying Mau Forest"
     src="https://static.forfuture.tech/public/dying-mau-forest-small.png"
     title="The Dying Mau Forest" />

> Query Engine
>
> :construction: **Work In Progress** :construction:
> This is currently a PoC for a Query Engine requested at
> [GochoMugo/tgfancy#5](https://github.com/GochoMugo/tgfancy/issues/5).
> We are open to contribution from you.

[![Supported Node.js Versions](https://img.shields.io/badge/node->=7-green.svg)](https://github.com/forfuturellc/mau)
 [![Build Status](https://travis-ci.org/forfuturellc/mau.svg?branch=master)](https://travis-ci.org/forfuturellc/mau)
 [![Coverage Status](https://coveralls.io/repos/github/forfuturellc/mau/badge.svg?branch=master)](https://coveralls.io/github/forfuturellc/mau?branch=master)
 [![Dependency Status](https://gemnasium.com/forfuturellc/mau.svg)](https://gemnasium.com/forfuturellc/mau)


## installation:

```bash
$ npm install --save mau
```


## documentation:

For now, please read through `example/telegram.js` (and the code of course).


## examples:

Before running the examples, you'll need to install some
additional modules:

```bash
# for ALL examples below
$ npm install tgfancy

# for Example 2 below
$ npm install http-proxy ngrok
```

**Example 1**: A single Telegram bot, using polling:

```bash
$ export TELEGRAM_TOKEN=xxxxx
$ node example/telegram.js
```


**Example 2**: Multiple Telegram bots, behind a proxy,
using webhooks:

```bash
# in a separate shell, start a bot instance
# listening on port 9101
$ export TELEGRAM_TOKEN=xxxxx
$ node example/telegram.js 9101

# in another separate shell, start another instance
# listening on port 9102
$ export TELEGRAM_TOKEN=xxxxx
$ node example/telegram.js 9102

# in another separate shell, start the proxy
# listening on port 9100, proxying to ports 9101 and 9102
$ export TELEGRAM_TOKEN=xxxxx
$ node example/proxy.js 9100 9101,9102
```

**Time to Play**: Send your bot the message `/example`...


## license:

***The MIT License (MIT)***

*Copyright (c) 2017 GochoMugo <mugo@forfuture.co.ke><br>
Copyright (c) 2017 Forfuture LLC <we@forfuture.co.ke>*

**#P004-2**
