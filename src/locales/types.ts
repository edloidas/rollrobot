export interface CommandText {
  command: string;
  description: string;
}

/** The replies `/pick` gives when it cannot pick, plus the note that explains a loose split. */
export interface PickText {
  /** Fewer than two options were given. */
  usage: string;
  /** The list ran past `MAX_PICK_ITEMS`. */
  tooMany: string;
  /** Appended to a result the whitespace fallback produced. */
  spaceSplit: string;
}

export interface Messages {
  /**
   * Inline result titles mirroring the commands they stand for, plus `answer` — the one
   * description line the list carries, since an answer has no notation to echo — and the
   * help button above them.
   */
  inline: {
    roll: string;
    full: string;
    random: string;
    ask: string;
    pick: string;
    answer: string;
    help: string;
  };
  pick: PickText;
  help: string;
  commands: CommandText[];
  /** Profile blurb shown in search — Telegram caps it at 120 characters. */
  shortDescription: string;
  /** "What can this bot do?" text — Telegram caps it at 512 characters. */
  description: string;
}
