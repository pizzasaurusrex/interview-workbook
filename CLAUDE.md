# Interview Problems Repo

## Rules

- Each problem lives in `problems/NNN_problem_name/`
- Create three files per problem:
  - `README.md` — problem statement
  - `test_NNN_problem_name.py` — basic tests for the user to pass
  - `solution.py` — function signature only (`pass` body), no implementation
- The user fills in the solution themselves

## Decisions

- **No solution or reference files ship in a problem directory.** Only the problem
  statement, tests, and any provided harness. A reference implementation written to
  validate tests lives in the scratchpad and is deleted from the problem directory in
  the same command that runs the suite.
- **Server problems expose a factory, not a module that listens on import.**
  `createServer(options?)` returning `{ listen(port): Promise<number>, close(): Promise<void> }`.
  `listen(0)` yields an ephemeral port so tests never collide; `close()` lets jest exit.
- **Server problems are tested over real sockets, not by importing internals.** Tests
  talk to the server through `harness.ts`, a small line-oriented TCP client. No
  subprocess spawning and no build step — Node 22+ executes `.ts` directly.
- **`process.argv[1]?.endsWith("server.ts")` is the direct-run guard, not `require.main`.**
  Node loads these files as ES modules (no `"type"` in package.json + `export` syntax),
  where `require` is undefined; ts-jest still compiles to CommonJS, so the argv check is
  the one form that works in both.
- **Examples use port 5050, never 5000.** macOS AirPlay Receiver holds `*:5000` and
  accepts connections while replying nothing, which reads exactly like a broken server.
- **LeetCode-style drills live in `problems/leetcode/`, grouped by topic, not in
  `NNN_` directories.** One `<topic>.ts` holding several problems (statement +
  examples in a doc comment, signature with a `throw new Error("Not implemented")`
  body) plus a matching `<topic>.test.ts`. Shared scaffolding like `tree.ts` sits
  at the folder root so topics can reuse it. TypeScript only.
- **Phased problems say which earlier tests a later part supersedes.** 007 Part 2
  replaces Part 1's echo behavior, so its README tells the solver to `describe.skip`
  the Part 1 suite.
