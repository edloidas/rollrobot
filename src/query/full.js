const { parseAndRoll } = require('roll-parser');

/*
Matches `full` command:
`/full` - command for chat
`/full@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(full)(@rollrobot)?(\s[\s\S]*)*$/;

function reply(notation) {
  const result = parseAndRoll(notation);

  if (result) {
    const rolls = result.rolls.join();
    return `\`(${result.notation})\` *${result.value}* \`[${rolls}]\``;
  }
  return null;
}

module.exports = {
  regexp,
  reply
};
