const GROUPS = ['group', 'supergroup', 'channel'];

const createOptions = msg => {
  let options = { parse_mode: 'Markdown' };

  const inGroup = GROUPS.some(type => type === msg.chat.type);
  if (inGroup) {
    options = Object.assign({ reply_to_message_id: msg.message_id }, options);
  }

  return options;
};

const createInlineOptions = () => ({
  parse_mode: 'Markdown'
});

module.exports = {
  createOptions,
  createInlineOptions
};
