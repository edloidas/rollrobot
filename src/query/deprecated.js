/*
Matches deprecated commands `sroll` or `droll` commands:
`/sroll` - command for chat
`/sroll@rollrobot` - command in group chat (named command)
*/
const regexp = /^\/(sroll|droll)(@rollrobot)?(\s[\s\S]*)*$/;

const options = {
  disable_web_page_preview: true,
};
