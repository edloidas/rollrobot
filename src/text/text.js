const help = `Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes several commands and can be used in inline mode:

@rollrobot [notation] -- inline request, recognizes both notations
/roll [notation] -- default roll, recognizes both notations
/full [notation] -- same to '/roll', but shows roll for each dice
/random -- 'd100' roll

Notation can be classic:
[count]d[dice]±[modifier] ([bottom],[top])
or simplfied:
[count] [dice] [modifier] [bottom] [top]
* count -- number of rolls
* dice -- dice type
* modifier -- value, that will be added or subtracted from result
* bottom -- all rolls below won't be
* top -- all rolls above won't be

Examples:
'/roll 20' ⇒ 'd20'
'/roll 2 10 -1' ⇒ result of '2d10-1'
'/roll 4d8+3' ⇒ result of '4d8+3'
'/wod 6d10!>6f1' ⇒ number of successes for '6d10!>6f1'
'/random' ⇒ d100

Rate the bot, if you like it.
https://telegram.me/storebot?start=rollrobot

Your ideas on improvement are welcome.

MIT © @edloidas`;

const deprecated = "'/sroll' and '/droll' commands are no longer supported.";

module.exports = {
  help,
  deprecated,
};
