const { parseAndRoll } = require('roll-parser');

/*
Matches `roll` command:
`/roll` - command for chat
`/roll@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(roll)(@rollrobot)?(\s[\s\S]*)*$/;

function reply(notation) {
  const result = parseAndRoll(notation);

  if (result) {
    return `\`(${result.notation})\` *${result.value}*`;
  }
  return null;
}

module.exports = {
  regexp,
  reply
};
