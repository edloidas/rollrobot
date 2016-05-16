const message = {
  start: {
    regexp: /\/start/,
    resp: `Roll the dice like no one before. Flexible settings allow you to generate random numbers by the following pattern (x)d(y)+(n), where (x) is number of dices, (y) related to the number of dice edges and (n) is a number that should be added to the randomly generated number.\nBot recognizes and interacts with several commands, such as:\n\n/roll (x) (y) (n) -- 2d10+0, x=2, y=10, n=0 by default.\n/sroll (n) -- 2d6+(n), n=0 by default\n/droll (n) -- 2d20+(n), n=0 by default\n/random (y) -- 1d100+0, y=100 by default\n\nYou can manually modify the pattern by writing command, such as /roll 2 10 5, which meand bot will make roll of 2 10-edged dices and add 5 to the result.\nOther examples:\nroll 1 -- 1d10\nroll 4 6 5 -- 4d6+10\ndroll 3 -- 2d20+3\nrandom -- 1d100\nrandom 300 -- 1d300\n\n\nSimply open the bot's profile and use the 'Add to group' button.\n\nWe wish you have much fun using our Roll Robot in your RPgames.\n\nYour ideas on improvement are welcome: https://github.com/edloidas/rollrobot/issues\n\nRoll Robot team,\n@edloidas and @nartien`,
    options: {
      disable_web_page_preview: true,
    },
  },
  roll: {
    regexp: /(\/roll){1}(\s+\d+){0,3}/,
  },
};

module.exports = message;
