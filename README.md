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
