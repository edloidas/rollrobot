function InputTextMessageContent( text, parseMode = 'Markdown', disablePreview = true ) {
  this.message_text = text;
  this.parse_mode = parseMode;
  this.disable_web_page_preview = disablePreview;
}

module.exports = InputTextMessageContent;
