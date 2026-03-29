# Commenting Rules

## Special Single-Line Prefixes

- `// ! ` — critical issues (bugs, security risks, breaking changes)

  ```ts
  // ! Potential race condition if fetch retries here
  ```

- `// ? ` — questions, uncertainties, rationale for unusual patterns

  ```ts
  // ? May need to memoize this when the call becomes too heavy
  ```

- `// * ` — logical block dividers in large files (surround with blank comment lines)

  ```ts
  //
  // * Event Handlers
  //

  /* ... */

  //
  // * Validators
  //

  /* ... */
  ```

- `// TODO: ` — actionable future work; start with an imperative verb, reference issue if possible

  ```ts
  // TODO: [#123] Replace mock with live API
  ```

> **Rule 1.1** Never combine prefixes (e.g. `// ! TODO`) — choose the one that best conveys intent.
> **Rule 1.2** Section headers (`// *`) should be concise (≤ 4 words).

## Comment Placement & Density

- Comment only non-obvious logic: algorithms, workarounds, edge cases.
- Avoid commenting trivial code (obvious mappings, simple getters).
- Prefer JSDoc/TSDoc for public API functions instead of inline prose.
- Keep comments inside function bodies minimal — context belongs in tests or docs.

## Maintenance

- Update or delete comments when code changes — stale comments are worse than none.
- Promote resolved `// TODO:` items to commits and remove the tag.
- Convert answered `// ?` questions into docs or ADRs once clarified.
