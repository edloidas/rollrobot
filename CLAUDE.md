# rollrobot

Telegram bot for dice rolling. JavaScript, Node.js. Uses `roll-parser` for notation parsing.

## Commands

```bash
npm test        # Run tests (Jest)
npm run lint    # ESLint
npm run cover   # Test coverage
```

## Constraints

- Runtime: Node.js (>= 18.12.1)
- Package manager: npm or pnpm
- Plain JavaScript (no TypeScript)
- Deployed via Vercel (webhook mode)

## Git & GitHub

Conventional Commits: `<type>: <description> #<issue>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

- Imperative mood, under 72 chars, no period
- Include issue number when related: `feat: add parser #5`
- `Co-Authored-By:` trailer only, no promotional lines
- Optional body: past tense, one line per change, backticks for code refs

### Issues

- **Title**: `<type>: <description>`
- Use `epic: <description>` for issues that aggregate sub-issues and describe a long-form implementation plan. Not used in commits.
- **Body**: concisely explain what and why, skip trivial details

  ```
  <4–8 sentence description: what, what's affected, how to reproduce, impact>

  ##### Rationale
  <why this needs to be fixed or implemented>

  <sub>Drafted with AI assistance</sub>
  ```

### Pull Requests

- **Title**: `<type>: <description> #<number>`
- **Body**: concise, no emojis, separate all sections with one blank line

  ```
  <summary of changes>

  Closes #<number>

  [Claude Code session](<link>)

  <sub>Drafted with AI assistance</sub>
  ```
