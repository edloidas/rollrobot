import { escapeHtml } from './format';

export const helpText = `Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes several commands and can be used in inline mode:

@rollrobot [notation] — inline request
/roll [notation] — default roll
/full [notation] — same to '/roll', but shows roll for each dice
/random — 'd100' roll

<b>Notation:</b>
<code>[count]d[dice]±[modifier]</code>
where ...
  • <code>count</code> — number of rolls
  • <code>dice</code> — dice type
  • <code>modifier</code> — value, that will be added or subtracted from result

<b>Examples:</b>
<code>/roll d20</code> ➜ result of 'd20'
<code>/roll 4d8+3</code> ➜ result of '4d8+3'
<code>/random</code> ➜ result of 'd100'`;

export const deprecatedText =
  '<code>/sroll</code> and <code>/droll</code> commands are no longer supported. Use /help for more details.';

export const errorText = "<i>Sorry, can't parse notation.</i>";

export function noPermissionText(chatName?: string): string {
  const where = chatName ? `in <b>${escapeHtml(chatName)}</b>` : 'in this chat';
  return `<i>I can't send messages ${where} — an admin needs to grant me the Send Messages permission.</i>`;
}
