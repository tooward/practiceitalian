# Italian Verb Practice (TypeScript)

A simple CLI to practice Italian verbs. Now migrated to TypeScript.
## Design overview

This document explains the runtime structure and where to make common changes. It's written so you (or an assistant) can quickly reason about edits, add features, and keep behaviour covered by tests.
### High-level architecture

- Entry point: `src/index.ts` — creates a readline-based `ConsoleUI` and calls `App.runFlow()` for the Flow/Scene UI. The simpler `App.run()` variant is useful for programmatic runs in tests.
- App orchestration: `src/core/app.ts` — constructs repositories, progress store, scheduler, exercises and sessions. It exposes `run`, `runFlow`, and `runWarmupOnly` helpers.
- Flow/Scene runner: `src/core/flow.ts` and scenes under `src/core/scenes.ts` (and related files) implement the interactive menu-driven UI.
- Session orchestration: `src/core/session.ts` — given a batch and a list of `Exercise` instances, it runs warm-ups then an optional conjugation phase.
- Exercises: `src/core/exercises.ts` — implementations of `InfinitiveTypingExercise`, `TranslationExercise`, `ConjugationExercise`. Warmup vs Conjugation ordering is important.
- Scheduling & selection: `src/core/scheduler.ts` — picks the batch for a session using progress stats, gating, and other heuristics.
- Persistence: `src/core/progress.ts` (JsonProgressStore) persists to `progress.json`. Unit tests use in-memory fakes under `test-helpers/`.
- Data: verbs, nouns, adjectives live in `data/` and are loaded via `src/core/repository.ts`.
- CLI helpers & utilities: `src/util.ts`, `src/conjugator.ts`, `src/intro.ts`, `src/practice.ts` (legacy/simpler script).
### Key types and shapes

- `Verb` (in `src/types.ts`): { infinitive, irregular?, translation?, present?: string[6], past?: string[6], future?: string[6], imperative?: [tu, voi] }
- `Progress` (in `src/types.ts` / `core/progress.ts`): map from infinitive -> per-tense arrays of 6 progress cells {correct, attempts} and lexical counters for it2en/en2it.

Contract (small):
- Inputs: arrays of `Verb` for a session; UI prompts and short text answers from the console.
- Outputs: console text, and persisted `progress.json` updates.
- Error modes: missing tense forms (ignored or shown as '(n/a)'), IO errors writing `progress.json` (logged); tests use fakes to avoid file IO.

Edge cases to consider when changing behaviour
- Missing conjugation arrays: many verbs use generated regular forms; confirm whether to require explicit arrays before marking a verb "eligible" for conjugation practice.
- Progress file missing/corrupt: code falls back to empty progress (see `practice.ts` and `core/progress.ts`).
- Lexical gating: warm-up requires 3 correct attempts both it2en and en2it; changing the gate value touches `core/progress.ts` and tests.

### Where to change common things
- Add/modify verbs or lexical data: edit `data/*.json` files. If adding a new category/theme, update `data/themes.json` and `src/core/repository.ts`.
- Add a new exercise type: implement `Exercise` in `src/core/exercises.ts` (or a new file), register it where `App` builds the exercises and update `Session` ordering if necessary.
- Change scheduling: edit `src/core/scheduler.ts` — unit tests under `src/core/__tests__` expect certain selection behaviour.
- Change progress persistence: edit `src/core/progress.ts`. Update `test-helpers/inMemoryProgress.ts` and tests accordingly.

### Helpful files to inspect during changes
- `src/core/app.ts` — application wiring.
- `src/core/session.ts` — session control flow, warm-up gating, conjugation phase.
- `src/core/scheduler.ts` — batching heuristics.
- `src/core/progress.ts` — storage and logical helpers (lexical gating, mastery checks).
- `src/core/exercises.ts` — exercise implementations and expected `Exercise` contract.
- `src/types.ts` — canonical data shapes.
- `src/util.ts` and `src/conjugator.ts` — small helper functions and string logic (fuzzy matching, formatting).

### Tests, linting, and quick iteration
- Unit tests: `src/**/__tests__` — many core behaviours are covered (session, scheduler, progress, exercises).
- Run the test + lint suite locally:

```sh
npm install
npm run lint
npm test
```

- Build and run:

```sh
npm run build
npm start
```

Dev mode (no build):

```sh
npm run dev
```

### Notes for when you ask me to make changes

When you request modifications, include these items to speed up correct edits:

- Intent: one-sentence description of the behaviour you want (e.g. "show translations in warm-up list" or "add a new tense called `conditional`").
- Concrete example: input -> expected output, including edge cases.
- Files to change (if known) or the feature area (e.g. scheduler, session, repository).
- Tests: whether you want new unit tests and which existing tests should be updated.
- Backwards compatibility: whether the `progress.json` schema may change or require migrations.

Minimal prompt template you can copy:

```
Change: <one-line intent>
Example: <what to type and expected console output>
Area/files: <optional list, e.g. src/core/session.ts, src/core/exercises.ts>
Tests: create/modify tests? (yes/no)
Compat: allow progress schema changes? (yes/no)
```

### Quick modification examples

- Add a new warm-up exercise: implement `Exercise.run(verb, context)` and register in `App.run` exercise array before `ConjugationExercise`.
- Increase lexical gating threshold: change the '3' in `progress.lex` helpers and update tests that assert gate behaviour.
- Make conjugation strict: replace `util.isCorrect` fuzzy check with exact match in `ConjugationExercise`.

### Quality gates before merging

- Build: `npm run build` (PASS/FAIL)
- Lint: `npm run lint` (PASS/FAIL)
- Tests: `npm test` (PASS/FAIL)

Include test updates for any change in selection, gating, or progress persistence.

## Status

- Request: "Update README to document design and include notes for modifications" — Done (this file).

If you'd like, I can also:

- Add a short ARCHITECTURE.md file with a diagram and a call graph.
- Open small PRs that implement one example change (e.g., change lexical gate to 4 and update tests).
# Italian Verb Practice (TypeScript)

A simple CLI to practice Italian verbs. Now migrated to TypeScript.

## Setup

```sh
npm install
```

![CI](https://github.com/tooward/practiceitalian/actions/workflows/ci.yml/badge.svg)

## Build and run

```sh
npm run build
npm start
```

## Dev (run without build)

```sh
npm run dev
```

Data: `verbs.json` at the repo root. Progress is saved to `progress.json` (git-ignored).

CI and linting

- The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs on pushes and pull requests to `main`.
- The workflow runs `npm ci`, then `npx eslint` and `npm test`.
- Locally you can run the same checks:

```sh
npm run lint
npm test
```

Note: CI runs automatically on GitHub when you push to the remote repository or open a pull request; it does not run for local-only commits.
