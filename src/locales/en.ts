import { playground, reference } from './links';
import type { Messages } from './types';

export const en: Messages = {
  inline: { roll: 'Roll', full: 'Full', random: 'Random', help: 'How to use' },

  help: `Roll the dice like no one before — full RPG notation with keep/drop, exploding dice, rerolls, success pools, and checks.

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

Name a roll by quoting it at the end: <code>/roll 2d20+1 "Perception"</code>.

Try notation live in the ${playground('playground')}, or read the full ${reference('notation reference')}.`,

  commands: [
    { command: 'roll', description: 'Roll dice — /roll 2d20kh1+5' },
    { command: 'full', description: 'Roll with a breakdown — /full 4d6kh3' },
    { command: 'random', description: 'Roll d100' },
    { command: 'help', description: 'Notation guide and links' },
  ],

  shortDescription:
    'Dice for tabletop RPGs in any chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',

  description: `Dice notation for tabletop RPGs, rolled in any chat.

4d6kh3 for ability scores, 2d20kh1+7 with advantage, 1d20+12 vs 20 for a Pathfinder check, 7d10>=6f1 for a Storyteller pool, {1d8!, 1d6!}kh1 for Savage Worlds, 4dF for Fate, d% for Call of Cthulhu.

/roll gives the total, /full a die-by-die breakdown, /help the notation guide. Type @rollrobot in any chat to roll without adding the bot.`,
};
