/*
Matches `start` or `help` commands:
`/start` - command for chat
`/start@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(roll)(@rollrobot)?(\s[\s\S]*)*$/;

const options = {
  disable_web_page_preview: true
};

module.exports = {
  regexp,
  options
};
