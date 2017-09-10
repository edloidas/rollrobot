const { parseAndRoll } = require('roll-parser');
const { createResultMessage } = require('../text');

/*
Matches `roll` command:
`/roll` - command for chat
`/roll@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(roll)(@rollrobot)?(\s[\s\S]*)*$/;

function reply(notation) {
  const result = parseAndRoll(notation);
  return createResultMessage(result);
}

module.exports = {
  regexp,
  reply
};
