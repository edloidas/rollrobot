export const BOT_COMMANDS = [
  { command: 'roll', description: 'Roll dice — /roll [notation]' },
  { command: 'full', description: 'Roll with details — /full [notation]' },
  { command: 'random', description: 'Roll d100' },
  { command: 'help', description: 'Show help and notation guide' },
] as const;

export const ALLOWED_UPDATES = ['message', 'inline_query', 'chosen_inline_result'] as const;
