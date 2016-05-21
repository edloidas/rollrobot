Roll Robot
==========

[![Travis Build Status](https://img.shields.io/travis/edloidas/rollrobot.svg?label=linux%20build)](https://travis-ci.org/edloidas/rollrobot)
[![AppVeyor Build Status](https://img.shields.io/appveyor/ci/edloidas/rollrobot.svg?label=windows%20build)](https://ci.appveyor.com/project/edloidas/rollrobot)
[![Coverage Status](https://coveralls.io/repos/github/edloidas/rollrobot/badge.svg?branch=master)](https://coveralls.io/github/edloidas/rollrobot?branch=master)
[![Dependency Status](https://david-dm.org/edloidas/rollrobot.svg)](https://david-dm.org/edloidas/rollrobot)
[![devDependency Status](https://david-dm.org/edloidas/rollrobot/dev-status.svg)](https://david-dm.org/edloidas/rollrobot#info=devDependencies)

[![https://telegram.me/rollrobot](https://img.shields.io/badge/💬 Telegram-rollrobot-blue.svg)](https://telegram.me/rollrobot)
[![https://telegram.me/edloidas](https://img.shields.io/badge/💬 Telegram-edloidas-blue.svg)](https://telegram.me/edloidas)

> A Telegram bot that can roll the dice like no one before.

## About ##

Roll Robot is a telegram bot used for common "roll the dice" purposes which is working on group chats.

## Description ##

Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes and interacts with several commands, including inline commands, such as:

* `@rollrobot (...values)` -- for inline requests, follows the /roll pattern
* `/roll (x) (y) (-)(n)` -- 2d10+0, x=2, y=10, n=0 by default
* `/sroll (n)` -- 2d6+(n), n=0 by default
* `/droll (n)` -- 2d20+(n), n=0 by default
* `/random (y)` -- 1d100+0, y=100 by default

Examples:
* (inline) `-1 -- 2d6-1 `
* `/roll 1 -- 1d10`
* `/roll 4 6 -3 -- 4d6-3`
* `/droll 3 -- 2d20+3`

Simply open the bot's profile and use the 'Add to group' button.

[Rate](https://telegram.me/storebot?start=rollrobot) the bot, if you like it.

Your ideas on improvement are welcome.

## Configuration ##

Deployed on [Heroku](https://heroku.com).

* Set the `Config Variables` from the app settings in the dashboard to access them from `process.env.*`.

| KEY   | VALUE     | DESCRIPTION |
| ----- | --------- | ----------- |
| TOKEN | `$TOKEN`  | Token, generated by the BotFather. |
| PORT  | 443       | Can be any of `[ 443, 80, 88, 8443 ]`. See [API](https://core.telegram.org/bots/api#setwebhook). |
| HOST  | 0.0.0.0   | Any IP |
| URL   | https://appname.herokuapp.com | `appname` is your app name on Heroku |

* Set the WebHook with the Telegram. Simply replace the variables in link and open it: https://api.telegram.org/bot{TOKEN}/setWebhook?url={URL}

* Receive the following response: `{"ok":true,"result":true,"description":"Webhook was set"}`
