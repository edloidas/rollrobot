export interface CommandText {
  command: string;
  description: string;
}

export interface Messages {
  /** Inline result titles — they mirror the commands they stand for. */
  inline: { roll: string; full: string; random: string };
  help: string;
  commands: CommandText[];
  /** Profile blurb shown in search — Telegram caps it at 120 characters. */
  shortDescription: string;
  /** "What can this bot do?" text — Telegram caps it at 512 characters. */
  description: string;
}
