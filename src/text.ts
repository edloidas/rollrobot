export const helpText = `Roll the dice like no one before. Generate random numbers by default RPG pattern (x)d(y)±(n).

Bot recognizes several commands and can be used in inline mode:

@rollrobot [notation] — inline request, recognizes both notations
/roll [notation] — default roll, recognizes both notations
/full [notation] — same to '/roll', but shows roll for each dice
/random — 'd100' roll

*Notation:*
*1.* Classic
    \`[count]d[dice]±[modifier]\`
*2.* World of Darkness
    \`[count]d[dice][!]>[success]f[fail]\`
*3.* Simplified (classic, space separated)
    \`[count] [dice] [modifier]\`
*4.* Single-valued
    \`[dice]\`
where ...
  • \`count\` — number of rolls
  • \`dice\` — dice type
  • \`modifier\` — value, that will be added or subtracted from result
  • \`!\` — sign, indicating to repeat
  • \`success\` — minimum roll value, that counts as success
  • \`fail\` — maximum roll value, that counts as fail

*Examples:*
\`/roll 20\` ➜ 'd20'
\`/roll 2 10 -1\` ➜ result of '2d10-1'
\`/roll 4d8+3\` ➜ result of '4d8+3'
\`/roll 6d10!>6f1\` ➜ number of successes for '6d10!>6f1'
\`/random\` ➜ 'd100'

Your ideas on improvement are welcome.

MIT © @edloidas`;

export const deprecatedText =
  '`/sroll` and `/droll` commands are no longer supported. Use /help for more details.';

export const errorText = "_Sorry, can't parse notation._";

function escapeMarkdown(text: string): string {
  return text.replace(/([*_`\[])/g, '\\$1');
}

export function noPermissionText(chatName?: string): string {
  const where = chatName ? `in *${escapeMarkdown(chatName)}*` : 'in this chat';
  return `_I can't send messages ${where} — an admin needs to grant me the Send Messages permission._`;
}

export function createResultMessage(result: any): string | null {
  if (result) {
    return `\`(${result.notation})\` *${result.value}*`;
  }
  return null;
}

export function createFullResultMessage(result: any): string | null {
  if (result) {
    const rolls = result.rolls.join();
    return `\`(${result.notation})\` *${result.value}* \`[${rolls}]\``;
  }
  return null;
}
