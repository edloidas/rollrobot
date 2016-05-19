module.exports =
`Roll the dice like no one before. Flexible settings allow you to generate random numbers by the following pattern (x)d(y)+(n), where (x) is number of dices, (y) related to the number of dice edges and (n) is a number that should be added to the randomly generated number.
Bot recognizes and interacts with several commands, such as:

/roll (x) (y) (n) -- 2d10+0, x=2, y=10, n=0 by default.
/sroll (n) -- 2d6+(n), n=0 by default
/droll (n) -- 2d20+(n), n=0 by default
/random (y) -- 1d100+0, y=100 by default

You can manually modify the pattern by writing command, such as /roll 2 10 5, which meand bot will make roll of 2 10-edged dices and add 5 to the result.
Other examples:
roll 1 -- 1d10
roll 4 6 5 -- 4d6+10
droll 3 -- 2d20+3
random -- 1d100
random 300 -- 1d300


Simply open the bot's profile and use the 'Add to group' button.

We wish you have much fun using our Roll Robot in your RPgames.

Your ideas on improvement are welcome: https://github.com/edloidas/rollrobot/issues

Roll Robot team,
@edloidas

Special thx to @nartien`;
