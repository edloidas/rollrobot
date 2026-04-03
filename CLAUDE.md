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

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, `release`

- Imperative mood, under 72 chars, no period
- Include issue number when related: `feat: add parser #5`
- `Co-Authored-By:` trailer only, no promotional lines
- Optional body: past tense, one line per change, backticks for code refs
- PRs should contain a single commit on merge; squash locally and force-push before merging unless the PR combines work from several tasks

### Releases

Versioning follows [semver](https://semver.org/) with prerelease tags: `3.0.0-alpha.1`, `3.0.0-beta.1`, `3.0.0-rc.1`, `3.0.0`.

1. Update `version` in `package.json` to the target version
2. Run `bun run validate` — must pass
3. Commit: `release: v<version>`
4. Tag: `git tag -a v<version> -m "v<version>"`
5. Push: `git push && git push --tags`

The `release.yml` GitHub workflow triggers on `v*` tags, verifies the tag is on `master`, and creates a GitHub Release via `softprops/action-gh-release`.

### Issue Labels

Each issue gets one **main** label + 0–2 **supportive** labels.

- **Main** (exactly one): `bug`, `feature`, `improvement`, `epic`
- **Supportive** (optional): `UI/UX`, `DX`, `AI`, `wontfix`

### Issues

- **Title**: `<type>: <description>` — e.g. `feat: add inline named rolls`
- Use `epic: <description>` for issues that aggregate sub-issues and describe a long-form implementation plan. Not used in commits.
- Always assign the issue to the current user unless a different assignee is specified.
- **Body**:

  ```
  <4–8 sentence description: what, what's affected, how to reproduce, impact>

  #### Rationale             ← optional
  <why this needs to be fixed or implemented>

  #### References            ← optional

  #### Implementation Notes  ← optional
  <any details, if already planned and described>
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
