const { parse, roll } = require('roll-parser');
const { createFullResultMessage } = require('../text');
const { limit } = require('../limiter');

/*
Matches `full` command:
`/full` - command for chat
`/full@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(full)(@rollrobot)?(\s[\s\S]*)*$/;

function reply(notation) {
  const result = roll(limit(parse(notation)));
  return createFullResultMessage(result);
}

const title = 'Full';

module.exports = {
  regexp,
  reply,
  title
};
