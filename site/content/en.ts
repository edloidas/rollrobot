import type { Manual } from './types';

export const en: Manual = {
  meta: {
    title: 'Roll Robot — dice for tabletop RPGs in any Telegram chat',
    description:
      'Full RPG dice notation in Telegram: keep/drop, exploding dice, rerolls, success pools and checks.',
    social: 'Telegram bot for tabletop RPG dice. Made by edloidas.io',
  },
  hero: {
    tagline:
      'Dice for tabletop RPGs in any chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',
    cta: 'Open in Telegram',
  },
  gettingStarted: {
    heading: 'Getting started',
    body: [
      'Open `@rollrobot`, press Start, send `/roll 2d6+3`. You get the expression it read and the total.',
      'Playing with a group? Add the bot to the chat. It replies to the message that called it, so several people can roll at once and each answer stays with its question. It needs permission to send messages, or it stays silent.',
      'In a chat you cannot add it to, use inline mode: type `@rollrobot 2d6+3` and tap the result. Works anywhere, joins nothing.',
    ],
  },
  commands: {
    heading: 'Commands',
    intro:
      'Five commands, the same in private chats and groups. `/roll` and `/full` take notation; send either bare for a plain `d20`.',
    items: [
      {
        command: 'roll',
        shortcut: 'r',
        summary: 'The total, with the expression normalized so you can check what it read.',
        examples: [{ notation: '2d6+3', rng: [4, 6], mode: 'compact' }],
      },
      {
        command: 'full',
        shortcut: 'f',
        summary:
          'The same roll, die by die. Dropped struck through, successes bold, failures underlined, a natural high or low arrowed.',
        examples: [{ notation: '4d6kh3', rng: [6, 5, 3, 1], mode: 'full' }],
      },
      {
        command: 'random',
        summary:
          '`d100` and nothing else, for when you just need a number out of a hundred. Same as `/roll d100`.',
        examples: [{ notation: 'd100', rng: [73], mode: 'compact' }],
      },
      {
        command: 'ask',
        shortcut: 'a',
        summary:
          'A yes-or-no answer for the calls not worth a roll — is the door trapped, does the merchant haggle, does it rain tonight. Everything after the command is the question, quoted back above the answer.',
        notes: [
          'No quotes needed. Punctuation, apostrophes and notation are all safe inside the question.',
          'Bare `/ask` works too: no question, just the answer, for a call already spoken aloud at the table.',
          'The answer is a `d2`, so it is a fair coin and nothing more.',
          'Yes and No stay English in every locale — your interface language is a poor guess at the language of the chat.',
        ],
        examples: [
          { kind: 'ask', question: 'Should we open the door?', answer: 'yes' },
          { kind: 'ask', answer: 'no' },
        ],
      },
      {
        command: 'help',
        summary:
          'The notation guide in one message, with links to the playground and the reference. This page in short, without leaving Telegram. `/start` prints the same.',
      },
    ],
  },
  betaFeatures: {
    heading: 'Beta features',
    intro:
      'Shipped and usable, but not settled: anything here may change shape or leave the bot in a later update. The five commands above will not.',
    items: [
      {
        command: 'pick',
        shortcut: 'p',
        summary:
          'Chooses one option out of a list you give it — a random encounter, who takes first watch, which door. One die over the options, nothing weighted unless you say so.',
        notes: [
          'Two options minimum, one hundred at most.',
          'A comma is all it takes — `Sneak past, Talk it out`. `|` and `;` do the same, and a line break outranks both, so a pasted table splits row by row.',
          'Only the first separator present is used, in that order: a line break, then `|` or `;`, then a comma, then plain spaces. Reach for `|` when an option contains a comma — `Rope, 50ft | Torch` splits into two, not three.',
          'Repeat an option to weight it: it takes one slot in the list per copy.',
          'A quoted name at the end labels the pick instead of joining the list.',
        ],
        examples: [
          {
            kind: 'pick',
            input: 'Goblin patrol | Empty room | Treasure hoard',
            choice: 'Empty room',
          },
          {
            kind: 'pick',
            input: 'Sneak past, Talk it out, Set an ambush',
            choice: 'Talk it out',
          },
        ],
      },
    ],
  },
  specialFeatures: {
    heading: 'Special features',
    intro:
      'None of this is needed for an ordinary roll. It is what the bot has for people who use it every session and want the typing out of the way.',
    items: [
      {
        title: 'Quoted names',
        description:
          'A name in double quotes at the end of a roll is quoted back above the result, so a chat full of bare numbers stays readable. It works on `/roll`, `/full` and `/pick` alike, and the curly quotes a phone keyboard substitutes are accepted as readily as straight ones.',
        important:
          '**The quotes are not optional.** The parser accepts so much that an unquoted word cannot be told apart from notation with any certainty, so `2d20kh1+7 Perception` is read as notation and fails, while `2d20kh1+7 "Perception"` rolls and takes the name.',
        example: {
          notation: '2d20kh1+7',
          rng: [8, 19],
          mode: 'compact',
          label: 'Perception',
        },
      },
      {
        title: 'Space-separated form',
        description:
          'Two or three numbers separated by spaces are read as a roll: `/roll 4 6` is `4d6`, and `/roll 1 20 -3` is `1d20-3`. The third number is the modifier, and it carries its own sign.',
        example: { notation: '1 20 -3', rng: [14], mode: 'compact' },
      },
      {
        title: 'Bare numbers',
        description: 'A number on its own is a die: `/roll 20` rolls a `d20`.',
        example: { notation: '20', rng: [12], mode: 'compact' },
      },
      {
        title: 'Cyrillic dice letters',
        description:
          '`к` and `д` fold to `d` before parsing, so `2к6` rolls `2d6`. Russian, Ukrainian and Belarusian notation all work the same, and the Latin `k` of `kh` and `kl` is untouched.',
        example: { notation: '2к6', rng: [3, 5], mode: 'compact' },
      },
      {
        title: 'Persian digits',
        description:
          '`۲۰` rolls a `d20`. Arabic-Indic and Persian numerals fold to ASCII before parsing; a quoted name keeps its own numerals untouched.',
        example: { notation: '۲۰', rng: [17], mode: 'compact' },
      },
    ],
  },
  inline: {
    heading: 'Inline mode',
    body: [
      'Type `@rollrobot` and notation in any chat, including groups that have never heard of the bot. A list opens above the keyboard; tap a result to send it as your own message.',
      '`@rollrobot 2d20kh1+7` offers one roll under two headings, Roll and Full. Choosing changes the display, not the dice — never a reroll.',
      'With nothing after the handle you get three presets: Roll and Full on a `d20`, Random on a `d100`.',
      'A question adds an Ask result, leading the list when nothing rolled and trailing it when something did. A named separator between two things that are not notation — `Goblin patrol | Empty room` — puts Pick at the top instead. Spaces alone do not count here, unlike `/pick`, or every half-typed question would offer a pick beneath its answer. An inline pick carries its pool in the message, having no command above it to reply to.',
      'Results are personal and uncached, so every query rolls afresh.',
    ],
  },
  notation: {
    heading: 'Notation',
    intro:
      'What you actually type. Case-insensitive and blind to spaces, so `2 D 20 KH 1` and `2d20kh1` are one roll. Each group below stops at the useful edge; the reference carries the rest, and the playground runs it.',
    links: { playground: 'Playground', reference: 'Full notation reference' },
    groups: [
      {
        heading: 'Dice and arithmetic',
        rows: [
          { notation: '2d6', description: 'Two six-sided dice.' },
          { notation: 'd20', description: 'The count defaults to one.' },
          { notation: '2d20+5', description: 'Arithmetic: + - * / and parentheses.' },
          { notation: '(1d6+2)*3', description: 'Parentheses group whatever you put in them.' },
          {
            notation: '(1d4)d6',
            description: 'A computed count: roll `1d4`, then that many `d6`.',
          },
        ],
      },
      {
        heading: 'Keep and drop',
        rows: [
          { notation: '4d6kh3', description: 'Keep the highest three — an ability score.' },
          { notation: '2d20kh1', description: 'Advantage: the higher of two `d20`.' },
          { notation: '2d20kl1', description: 'Disadvantage: the lower.' },
          { notation: '4d6dl1', description: 'Drop the lowest; `dh` drops the highest.' },
          {
            notation: '{1d8!, 1d6!}kh1',
            description: 'Keep across a group — each sub-roll competes as one die.',
          },
        ],
      },
      {
        heading: 'Exploding dice',
        rows: [
          { notation: 'd8!', description: 'A maximum roll adds another die.' },
          { notation: 'd8!!', description: 'Compound: the extra folds into the same die.' },
          { notation: 'd8!p', description: 'Penetrating: every extra die takes −1.' },
          { notation: '5d10!=10', description: 'Explode on a threshold, not the top face.' },
        ],
      },
      {
        heading: 'Rerolls and clamps',
        rows: [
          { notation: '2d6r<3', description: 'Reroll under 3, as often as it takes.' },
          { notation: '2d6ro<3', description: 'Reroll once, keep the second result.' },
          { notation: '4d6min2', description: 'Lift every die to at least 2.' },
          { notation: '4d6max5', description: 'Cap every die at 5.' },
        ],
      },
      {
        heading: 'Success pools and checks',
        rows: [
          { notation: '12d6>=5', description: 'Every 5 and 6 counts as a success.' },
          { notation: '7d10>=6f1', description: 'Count successes, subtract 1s as failures.' },
          {
            notation: '1d20+7 vs 15',
            description: 'Check against a DC, answered as a degree of success.',
          },
        ],
      },
      {
        heading: 'Other dice and functions',
        rows: [
          { notation: '4dF', description: 'Fate dice, each one −1, 0 or +1.' },
          { notation: 'd%', description: 'Percentile — the same die as `1d100`.' },
          {
            notation: '2d6+floor(1d4/2)',
            description: 'Functions: `floor`, `ceil`, `round`, `abs`, `min`, `max`, `sqrt`, `pow`.',
          },
        ],
      },
    ],
  },
  systems: {
    heading: 'By game system',
    intro: 'The roll each table reaches for first, ready to copy.',
    items: [
      {
        system: 'D&D 5e',
        description: 'Attack with advantage: two `d20`, keep the higher, add your bonus.',
        example: { notation: '2d20kh1+7', rng: [8, 19], mode: 'full' },
      },
      {
        system: 'Pathfinder 2e',
        description:
          'A check against a DC. Beat it by ten for a critical success, miss by ten for a critical failure; a natural 20 or 1 shifts the result one step.',
        example: { notation: '1d20+12 vs 20', rng: [18], mode: 'full' },
      },
      {
        system: 'World of Darkness',
        description: 'A Storyteller pool: successes on 6 or better, every 1 cancelling one.',
        example: { notation: '7d10>=6f1', rng: [8, 6, 2, 10, 1, 4, 7], mode: 'full' },
      },
      {
        system: 'Shadowrun',
        description: 'Hits on 5 and 6 across the whole pool.',
        example: {
          notation: '12d6>=5',
          rng: [5, 3, 6, 2, 4, 5, 1, 6, 3, 5, 2, 4],
          mode: 'full',
        },
      },
      {
        system: 'Savage Worlds',
        description: 'Trait die and wild die, both exploding; the higher of the two counts.',
        example: { notation: '{1d8!, 1d6!}kh1', rng: [5, 6, 3], mode: 'full' },
      },
      {
        system: 'Fate',
        description: 'Four Fudge dice plus a skill rating.',
        example: { notation: '4dF+2', rng: [1, 0, -1, 1], mode: 'full' },
      },
      {
        system: 'Call of Cthulhu',
        description: 'Roll under your skill on percentile dice.',
        example: { notation: 'd%', rng: [37], mode: 'compact' },
      },
    ],
  },
  limits: {
    heading: 'Limits',
    body: [
      'One roll is capped at 100 dice and 100 explode or reroll iterations. Ask for more and the bot says so instead of rolling — the caps are what keep a reply inside Telegram’s 4096-character limit.',
      'A breakdown still past 3500 characters is dropped for the compact reply, so a large pool answers with its total rather than not at all.',
      '`/pick` takes at most 100 options. A longer list is rejected, not trimmed: keeping the first hundred would quietly bias every pick toward the top while still looking like it worked.',
      'A quoted name is cut to 100 characters, a question to `/ask` to 300.',
    ],
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        question: 'Do I have to add the bot to my group?',
        answer:
          'No. Type `@rollrobot` and notation in any chat, then pick a result — it is sent as your own message and the bot never joins. Adding it is only worth it when the table rolls often, since a command is shorter to type.',
      },
      {
        question: 'Does the bot read my messages?',
        answer:
          'It acts only on what is addressed to it: commands beginning with a slash, and inline queries beginning with `@rollrobot`. Ordinary conversation is ignored — there is no handler for it.',
      },
      {
        question: 'Is anything stored?',
        answer:
          'No. Nothing you send is kept: not the text of a question, not the options in a pick list, not a name you quoted, not a single result. What is recorded is the shape of a roll and nothing else — `2d6`, `4d6kh3`, the command it came from — with the Telegram user ID reduced to a salted hash so repeat use can be counted without the account being identified. That dataset is write-only; it exists to show which notation is worth supporting, and it cannot be read back into a conversation.',
      },
      {
        question: 'Are the rolls fair?',
        answer:
          'Every roll is drawn fresh from roll-parser’s generator, seeded anew each time. Nothing is precomputed, and no result carries over from one roll to the next.',
      },
      {
        question: 'Can I name a roll?',
        answer:
          'Quote a name at the end and it appears above the result: `/roll 2d20kh1+7 "Perception"`. It works for `/pick` too.',
      },
      {
        question: 'Why is `4d6d1` an error?',
        answer:
          'A bare `d` after a pool is ambiguous — drop one, or roll that many dice again? Write `4d6dl1` to drop the lowest, or `(4d6)d1` for nested dice.',
      },
      {
        question: 'My notation was rejected. What now?',
        answer:
          'The bot echoes what you sent with carets under the part it could not read, so the fix is usually visible in the reply. Awkward cases are quicker to debug in the playground, linked at the foot of this page.',
      },
      {
        question: 'What language does the bot speak?',
        answer:
          'The command menu, the inline titles and the notation guide follow your Telegram interface language across English, Spanish, Portuguese, German, Russian, Ukrainian, Belarusian and Persian; anything else falls back to English. Results are notation, so they read the same everywhere. Yes and No stay English on purpose — your interface language is a poor guess at the language of the chat you are writing in.',
      },
    ],
  },
  footer: {
    playground: 'Playground',
    reference: 'Notation reference',
    source: 'Source',
  },
};
