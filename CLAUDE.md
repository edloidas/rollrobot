# rollrobot

Telegram bot for dice rolling. TypeScript, Bun, grammY. Uses `roll-parser` for notation parsing.

## Commands

```bash
bun run test        # Run tests (bun:test)
bun run lint        # Biome lint
bun run validate    # Full check: typecheck + lint + format:check + test
```

## Constraints

- Runtime: Bun
- Language: TypeScript (relaxed — `any` allowed during migration)
- Bot framework: grammY with webhook mode
- Deployment: Railway

## Git & GitHub

Conventional Commits: `<type>: <description> #<issue>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

- Imperative mood, under 72 chars, no period
- Include issue number when related: `feat: add parser #5`
- `Co-Authored-By:` trailer only, no promotional lines
- Optional body: past tense, one line per change, backticks for code refs
- PRs should contain a single commit on merge; squash locally and force-push before merging unless the PR combines work from several tasks

### Issues

- **Title**: `<type>: <description>`
- Use `epic: <description>` for issues that aggregate sub-issues and describe a long-form implementation plan. Not used in commits.
- Always assign the issue to the current user unless a different assignee is specified.
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
