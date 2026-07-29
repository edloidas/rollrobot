import type { RollOptions } from 'roll-parser';

// ! Keeps replies within Telegram's 4096-char message limit — a breakdown of
//   100 ten-digit dice is ~1.3k chars, so raising maxDice needs a new estimate
export const ROLL_LIMITS: RollOptions = {
  maxDice: 100,
  maxExplodeIterations: 100,
  maxRerollIterations: 100,
};
