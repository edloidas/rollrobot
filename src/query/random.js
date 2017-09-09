const { parseAndRollSimple } = require('roll-parser');

/*
Matches `random` commands:
`/random` - command for chat
`/random@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(random)(@rollrobot)?(\s.*)*$/;

function reply() {
  const result = parseAndRollSimple('100');
  return `\`(${result.notation})\` *${result.value}*`;
}

module.exports = {
  regexp,
  reply
};
