Roll Robot
==========

[![https://telegram.me/rollrobot](https://img.shields.io/badge/💬%20Telegram-rollrobot-blue.svg)](https://telegram.me/rollrobot)
[![https://telegram.me/edloidas](https://img.shields.io/badge/💬%20Telegram-edloidas-blue.svg)](https://telegram.me/edloidas)

> A Telegram bot that can roll the dice like no one before.

## About ##

Roll Robot is a telegram bot used for common "roll the dice" purposes which is working on group chats.

## Description ##

Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes several commands and can be used in inline mode:

@rollrobot [notation] -- inline request, recognizes both notations
/roll [notation] -- default roll, recognizes both notations
/full [notation] -- same to '/roll', but shows roll for each dice
/random -- 'd100' roll

#### Notation: ####
1. Classic<br/>
    `[count]d[dice]±[modifier]`
2. World of Darkness<br/>
    `[count]d[dice][!]>[success]f[fail]`
3. Simplfied (classic, space separated)<br/>
    `[count] [dice] [modifier]`
4. Single-valued<br/>
    `[dice]`
where ...
  * `count` -- number of rolls
  * `dice` -- dice type
  * `modifier` -- value, that will be added or subtracted from result
  * `!` -- sign, indicating to repeat
  * `success` -- minimum roll value, that counts as success
  * `fail` -- maximum roll value, that counts as fail

#### Examples: ####
`/roll 20` ➜ 'd20'<br/>
`/roll 2 10 -1` ➜ result of '2d10-1'<br/>
`/roll 4d8+3` ➜ result of '4d8+3'<br/>
`/wod 6d10!>6f1` ➜ number of successes for '6d10!>6f1'<br/>
`/random` ➜ 'd100'

[Rate](https://telegram.me/storebot?start=rollrobot) the bot, if you like it.

Your ideas on improvement are welcome.

## Configuration ##

Deployed on [Vercel](https://heroku.com).

* Set the `Config Variables` from the app settings in the dashboard to access them from `process.env.*`.

| KEY   | VALUE     | DESCRIPTION |
| ----- | --------- | ----------- |
| TOKEN | `$TOKEN`  | Token, generated by the BotFather. |
| PORT  | 443       | Can be any of `[ 443, 80, 88, 8443 ]`. See [API](https://core.telegram.org/bots/api#setwebhook). |
| HOST  | 0.0.0.0   | Any IP |
| URL   | https://appname.vercell.app | `appname` is your app name on Vercel |

* Set the WebHook with the Telegram. Simply replace the variables in link and open it: https://api.telegram.org/bot{TOKEN}/setWebhook?url={URL}

* Receive the following response: `{"ok":true,"result":true,"description":"Webhook was set"}`
