## examples:

* [setting up](#setting-up)
* [examples](#examples)


<a name="setting-up"></a>
### setting up:

Clone this repository:

```bash
$ git clone https://github.com/forfuturellc/mau.git
```

Change into the cloned repo and install dependencies:

```bash
# Change directory.
$ cd mau/

# Install 'production' dependencies.
# You may leave out '--only=prod' if you want to develop.
$ npm install --only=prod
```

Change into the `example/` directory:

```bash
$ cd example/
```

Some additional dependencies are required to run the
examples. You'll need to install them:

```bash
# For ALL examples.
$ npm install tgfancy

# For example #2.
$ npm install http-proxy ngrok
```

You will also need [Redis][redis] for example #2.


<a name="examples"></a>
### examples:

* [Example #1](#example-1): A single Telegram bot
* [Example #2](#example-2): Multiple Telegram bots


---

<a name="example-1"></a>
**Example #1**: A single Telegram bot:

```bash
# Add your Telegram bot's token to the environment.
$ export TELEGRAM_TOKEN=xxxxx

# Run the bot.
# Leave out 'NO_REDIS=1' if you want to use Redis.
$ NO_REDIS=1 node example/telegram.js
```

**Time to Play**: Send your bot a message.


---

<a name="example-2"></a>
**Example #2**: Multiple Telegram bots:

You **MUST** have [Redis][redis] installed. Port is assumed
to be `6379`. Port can be changed using environment variable
`REDIS_PORT`.

```bash
# In a separate shell, start a bot instance
# listening on port 9101.
$ export TELEGRAM_TOKEN=xxxxx
$ node example/telegram.js 9101

# In another separate shell, start another instance
# listening on port 9102.
$ export TELEGRAM_TOKEN=xxxxx
$ node example/telegram.js 9102

# ... Run more instances if you wish ...

# In another separate shell, start the proxy
# listening on port 9100, proxying to ports 9101 and 9102.
# Append the port numbers of any additional instances you have started. Mind the commas.
# Leave out `PROXY_PORT=9100` to have proxy listen on its default port i.e. 9100.
$ export TELEGRAM_TOKEN=xxxxx
$ PROXY_PORT=9100 node example/proxy.js 9101,9102
```

**Time to Play**: Send your bot a message.


[redis]: https://redis.io
