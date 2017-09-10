const { parseAndRoll } = require('roll-parser');
const { createFullResultMessage } = require('../text');

/*
Matches `full` command:
`/full` - command for chat
`/full@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(full)(@rollrobot)?(\s[\s\S]*)*$/;

function reply(notation) {
  const result = parseAndRoll(notation);
  return createFullResultMessage(result);
}

module.exports = {
  regexp,
  reply
};
