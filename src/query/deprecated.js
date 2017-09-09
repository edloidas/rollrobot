const { deprecated } = require('../text');

/*
Matches deprecated commands `sroll` or `droll` commands:
`/sroll` - command for chat
`/sroll@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(sroll|droll)(@rollrobot)?(\s[\s\S]*)*$/;

const reply = () => deprecated;

module.exports = {
  regexp,
  reply
};
