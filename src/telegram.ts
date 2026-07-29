export const BOT_COMMANDS = [
  { command: 'roll', description: 'Roll dice — /roll 2d20kh1+5' },
  { command: 'full', description: 'Roll with a breakdown — /full 4d6kh3' },
  { command: 'random', description: 'Roll d100' },
  { command: 'help', description: 'Notation guide and links' },
] as const;

export const ALLOWED_UPDATES = ['message', 'inline_query', 'chosen_inline_result'] as const;
