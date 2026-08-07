import { escapeHtml } from './format';

export const helpText = `Roll the dice like no one before — full RPG notation with keep/drop, exploding dice, rerolls, success pools, and checks.

<b>Commands</b>
/roll [notation] — roll and show the total (shortcut: /r)
/full [notation] — roll with a die-by-die breakdown (shortcut: /f)
/random — roll d100 (<code>d%</code>)
/help — this guide

Inline: type @rollrobot [notation] in any chat, or pick a preset from the list.

<b>Notation</b>
<code>2d20+5</code> — dice and arithmetic: + - * / and parentheses
<code>4d6kh3</code> — keep the highest 3 (also kl, dh, dl)
<code>d8!</code> — exploding dice
<code>2d6r&lt;3</code> — reroll below 3 (ro — reroll once)
<code>4d6min2</code> — clamp each die to at least 2 (also max)
<code>6d10&gt;=6f1</code> — count successes, subtract 1s as failures
<code>1d20+7 vs 15</code> — check against a DC with degrees of success
<code>4dF</code> — Fate dice, <code>d%</code> — percentile
<code>2d6+floor(1d4/2)</code> — functions: floor, ceil, round, abs, min, max, sqrt, pow

Shorthand: <code>/roll 20</code> rolls d20, <code>/roll 2 10 -1</code> rolls 2d10-1.

Try notation live in the <a href="https://roll-parser.edloidas.io/">playground</a>, or read the full <a href="https://roll-parser.edloidas.io/reference">notation reference</a>.`;

export const errorText = "<i>Sorry, can't parse notation.</i>";

export function noPermissionText(chatName?: string): string {
  const where = chatName ? `in <b>${escapeHtml(chatName)}</b>` : 'in this chat';
  return `<i>I can't send messages ${where} — an admin needs to grant me the Send Messages permission.</i>`;
}
