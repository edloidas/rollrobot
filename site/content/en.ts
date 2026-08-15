import type { Manual } from './types';

export const en: Manual = {
  meta: {
    title: 'Roll Robot — dice for tabletop RPGs in any Telegram chat',
    description:
      'Full RPG dice notation in Telegram: keep/drop, exploding dice, rerolls, success pools and checks.',
  },
  hero: {
    tagline:
      'Dice for tabletop RPGs in any chat — D&D, Pathfinder, World of Darkness, Shadowrun, Fate, Call of Cthulhu.',
    cta: 'Open in Telegram',
  },
  gettingStarted: {
    heading: 'Getting started',
    body: [
      'Open @rollrobot in Telegram, press Start, and send /roll 2d6+3. The bot answers with the expression it understood and the total. Nothing to install, no account to make.',
      'To roll for a table, add the bot to your group. It replies to the message it was called from, so several people can roll at once without the thread coming apart. All it needs is permission to send messages — without it the bot goes quiet, and the private note explaining why only reaches you if you have opened a chat with it before.',
      'In a chat you cannot add it to, type @rollrobot followed by your notation instead. That works everywhere, without the bot joining anything.',
    ],
  },
  commands: {
    heading: 'Commands',
    intro:
      'Six commands, each working the same in a private chat and in a group. /roll and /full take notation; send either with nothing after it and you get a plain d20.',
    items: [
      {
        command: 'roll',
        shortcut: 'r',
        summary:
          'Rolls and shows the total, with the expression normalized so you can see what the bot read. Quote a name at the end and it rides above the result.',
        example: { notation: '2d6+3', rng: [4, 6], mode: 'compact', label: 'Damage' },
      },
      {
        command: 'full',
        shortcut: 'f',
        summary:
          'The same roll plus a die-by-die breakdown. Dropped dice are struck through, successes bold, failures underlined, and a natural high or low carries an arrow.',
        example: { notation: '4d6kh3', rng: [6, 5, 3, 1], mode: 'full' },
      },
      {
        command: 'random',
        summary:
          'Rolls d100 and nothing else — no notation to type, for when you just need a number out of a hundred. Identical to /roll d100.',
        example: { notation: 'd100', rng: [73], mode: 'compact' },
      },
      {
        command: 'ask',
        shortcut: 'a',
        summary:
          'Answers Yes or No to a question, quoting it above the answer — /ask Should we open the door? The whole line is the question, so punctuation, quotes and notation are all safe inside it. Behind the answer is a coin you can flip yourself:',
        example: { notation: 'd2', rng: [1], mode: 'compact' },
      },
      {
        command: 'pick',
        shortcut: 'p',
        summary:
          'Picks one option out of a list — /pick Goblin patrol | Empty room | Treasure hoard. Two options minimum, split on the first separator present: a newline, then | or ;, then a comma, then spaces. Repeating an option weights it. Still in beta. Behind the choice is one die over the list:',
        example: { notation: 'd3', rng: [2], mode: 'compact' },
      },
      {
        command: 'help',
        summary:
          'The notation guide in a single message, with links to the playground and the reference — the short form of this page, without leaving Telegram. /start prints the same thing.',
      },
    ],
  },
  inline: {
    heading: 'Inline mode',
    body: [
      'Type @rollrobot followed by notation in any chat — a group that has never heard of the bot, a private conversation, anywhere Telegram offers inline results. A list pops up above the keyboard; tap a result and it is sent as your own message.',
      '@rollrobot 2d20kh1+7 offers that one roll under two headings, Roll and Full. Picking between them changes the display, not the dice — it is the same result either way, never a reroll.',
      'With nothing typed after the handle, the list falls back to three presets: Roll and Full on a d20, and Random on a d100.',
      'Type a question rather than notation and an Ask result joins the list, leading it when nothing rolled and trailing it when something did. Put a | or a comma between two things that are not notation — Goblin patrol | Empty room — and Pick leads the list instead. An inline pick carries its pool inside the message, having no command above it to reply to.',
      'Results are personal and uncached, so every query rolls afresh.',
    ],
  },
  notation: {
    heading: 'Notation',
    intro:
      'What you actually type. Notation is case-insensitive and ignores spaces, so 2 D 20 KH 1 and 2d20kh1 are the same roll. Each group below stops at the useful edge; the reference carries the rest.',
    groups: [
      {
        heading: 'Dice and arithmetic',
        rows: [
          { notation: '2d6', description: 'Two six-sided dice.' },
          { notation: 'd20', description: 'The count defaults to one.' },
          { notation: '2d20+5', description: 'Arithmetic: + - * / and parentheses.' },
          { notation: '(1d6+2)*3', description: 'Parentheses group whatever you put in them.' },
          { notation: '(1d4)d6', description: 'A computed count — roll 1d4, then that many d6.' },
        ],
      },
      {
        heading: 'Keep and drop',
        rows: [
          { notation: '4d6kh3', description: 'Keep the highest three — an ability score.' },
          { notation: '2d20kh1', description: 'Advantage: keep the higher of two d20.' },
          { notation: '2d20kl1', description: 'Disadvantage: keep the lower.' },
          { notation: '4d6dl1', description: 'Drop the lowest; dh drops the highest.' },
          {
            notation: '{1d8!, 1d6!}kh1',
            description: 'Keep across a group — each sub-roll competes as a single die.',
          },
        ],
      },
      {
        heading: 'Exploding dice',
        rows: [
          { notation: 'd8!', description: 'A maximum roll adds another die.' },
          { notation: 'd8!!', description: 'Compound: the extra folds into the same die.' },
          { notation: 'd8!p', description: 'Penetrating: every extra die takes a −1 penalty.' },
          { notation: '5d10!=10', description: 'Explode on a threshold instead of the top face.' },
        ],
      },
      {
        heading: 'Rerolls and clamps',
        rows: [
          { notation: '2d6r<3', description: 'Reroll anything under 3, as often as it takes.' },
          { notation: '2d6ro<3', description: 'Reroll once and keep the second result.' },
          { notation: '4d6min2', description: 'Lift every die to at least 2.' },
          { notation: '4d6max5', description: 'Cap every die at 5.' },
        ],
      },
      {
        heading: 'Success pools and checks',
        rows: [
          { notation: '12d6>=5', description: 'Count every 5 and 6 as a success.' },
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
          { notation: 'd%', description: 'Percentile — the same die as 1d100.' },
          {
            notation: '2d6+floor(1d4/2)',
            description: 'Functions: floor, ceil, round, abs, min, max, sqrt, pow.',
          },
        ],
      },
      {
        heading: 'Naming and shorthand',
        rows: [
          {
            notation: '2d20kh1+7 "Perception"',
            description: 'A quoted name at the end appears above the result.',
          },
          { notation: '/roll 20', description: 'A bare number is a die — this rolls d20.' },
          { notation: '/roll 2 10 -1', description: 'The old space-separated form: 2d10-1.' },
          { notation: '/roll', description: 'Nothing at all still rolls a d20.' },
        ],
      },
    ],
    referenceLabel: 'Full notation reference',
  },
  systems: {
    heading: 'By game system',
    intro: 'The roll each table reaches for first, ready to copy.',
    items: [
      {
        system: 'D&D 5e',
        description: 'Attack with advantage: two d20, keep the higher, add your bonus.',
        example: { notation: '2d20kh1+7', rng: [8, 19], mode: 'full' },
      },
      {
        system: 'Pathfinder 2e',
        description:
          'A check against a DC. Beating it by ten or more is a critical success, missing by ten a critical failure, and a natural 20 or 1 shifts the result one step.',
        example: { notation: '1d20+12 vs 20', rng: [18], mode: 'full' },
      },
      {
        system: 'World of Darkness',
        description: 'A Storyteller pool: successes on 6 or better, every 1 cancelling one.',
        example: { notation: '7d10>=6f1', rng: [8, 6, 2, 10, 1, 4, 7], mode: 'full' },
      },
      {
        system: 'Shadowrun',
        description: 'Count hits on 5 and 6 across the whole dice pool.',
        example: {
          notation: '12d6>=5',
          rng: [5, 3, 6, 2, 4, 5, 1, 6, 3, 5, 2, 4],
          mode: 'full',
        },
      },
      {
        system: 'Savage Worlds',
        description:
          'Trait die and wild die, both exploding — whichever of the two comes out higher is the one that counts.',
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
      'A single roll is capped at 100 dice, and at 100 explode or reroll iterations. Ask for more and the bot says so instead of rolling — the caps are what keep a reply inside Telegram’s 4096-character message limit.',
      'A breakdown that still runs past 3500 characters is dropped in favour of the compact reply, so a large pool answers with its total rather than not at all.',
      '/pick takes at most 100 options. A longer list is rejected rather than trimmed: keeping the first hundred would quietly bias every pick toward the top of the list while still looking like it worked.',
      'A quoted name is cut to 100 characters, and a question to /ask to 300.',
    ],
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        question: 'Do I have to add the bot to my group?',
        answer:
          'No. Type @rollrobot followed by notation in any chat and pick a result — the roll is sent as your own message and the bot never joins. Adding it is only worth it when the whole table rolls often, since a command is shorter to type than an inline query.',
      },
      {
        question: 'Does the bot read my messages?',
        answer:
          'It only acts on what is addressed to it: commands beginning with a slash, and inline queries beginning with @rollrobot. Ordinary conversation in a group is ignored — there is no handler for it.',
      },
      {
        question: 'Is anything stored?',
        answer:
          'Two things, with different answers. The usage statistics record only the shape of a roll — 2d6, 4d6kh3 — never a total, never the text of a question or a pick list, and the Telegram user ID only as a salted hash; that dataset is write-only. The operational logs are wider: every call writes a line carrying the sender, the group it came from, what was sent and what came back — including the question you put to /ask and the answer it gave, and the options you offered /pick and the one it chose. Nothing there is sampled away, and the operator can read it.',
      },
      {
        question: 'Are the rolls fair?',
        answer:
          'Every roll is drawn fresh from roll-parser’s generator, seeded anew each time. Nothing is precomputed and no result is held over from one roll to the next.',
      },
      {
        question: 'Can I name a roll?',
        answer:
          'Quote a name at the end and it appears above the result: /roll 2d20kh1+7 "Perception". It works for /pick too, and the smart quotes a phone keyboard substitutes are all accepted.',
      },
      {
        question: 'What happened to the old /roll 20 style?',
        answer:
          'It still works. A bare number is a die, so /roll 20 rolls d20, and /roll 2 10 -1 rolls 2d10-1, the way the pre-v3 bot did.',
      },
      {
        question: 'Why is 4d6d1 an error?',
        answer:
          'A bare d after a pool is ambiguous — it could mean "drop one" or "roll that many dice again". Write 4d6dl1 to drop the lowest, or (4d6)d1 if you really meant nested dice.',
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
      {
        question: 'Can I roll in Cyrillic or Persian digits?',
        answer:
          'Yes. ۲۰ rolls a d20, and 2к6 rolls 2d6 — the Cyrillic к and д from «кубик» fold to d before parsing. A quoted name keeps its own numerals and letters untouched.',
      },
    ],
  },
  footer: {
    playground: 'Playground',
    reference: 'Notation reference',
    source: 'Source',
  },
};
