# TCP Job Queue

Build a job queue that producers and workers share over raw TCP:

```
$ nc localhost 5050          $ nc localhost 5050   # a worker
SUBMIT resize avatar.png
ID 1
                             CLAIM worker-a
                             JOB 1 resize avatar.png
                             ACK 1
                             OK
```

There is no HTTP and no framework here. You get a byte stream, so **you** own the
framing: one request per `\n`, buffered out of whatever chunks TCP hands you.

## What you implement

Create `server.ts` in this directory:

```ts
export interface QueueOptions {
  /** Part 2: how long a claim is held before the job is redelivered. Default 30000. */
  leaseMs?: number;
  /** Part 3: attempts allowed before a job is declared dead. Default 3. */
  maxAttempts?: number;
}

export interface QueueServer {
  /** Starts listening. Pass 0 for an ephemeral port. Resolves with the actual port. */
  listen(port: number): Promise<number>;
  /** Closes the listener and every open connection. */
  close(): Promise<void>;
}

export function createServer(options?: QueueOptions): QueueServer;
```

A factory rather than a server that starts on import, because each test needs its own
empty queue: `listen(0)` lets the OS pick a free port so parallel tests never collide,
and `close()` lets jest exit. That is test plumbing, not part of the problem.

Make it runnable directly as well, so you can drive it from two `nc` sessions:

```ts
// Node loads this file as an ES module, so `require.main` does not exist here.
if (process.argv[1]?.endsWith("server.ts")) {
  const port = Number(process.argv[2] ?? 5050);
  createServer().listen(port).then((p) => console.log(`listening on ${p}`));
}
```

Node 22+ runs TypeScript directly — no build step, no `tsx`:

```
node problems/009_tcp_job_queue/server.ts 5050
```

**Do not use port 5000 on macOS.** AirPlay Receiver listens there, so `nc` connects to
*it* and silently answers nothing — a very convincing fake bug.

## The files

| File | Whose | What |
| --- | --- | --- |
| `README.md` | — | This spec: every request and response string |
| `harness.ts` | provided | A programmable `nc` — `await client.request("CLAIM w1")` sends a line and returns the reply. Never edit it. |
| `server.test.ts` | provided | The tests |
| `server.ts` | **you** | The queue |

## Protocol

- One UTF-8 request per line terminated by `\n`; tolerate a trailing `\r`.
- One response line per request, except `CLAIM` in Part 5.
- Command words are case-insensitive. A payload is the rest of the line and may
  contain spaces.
- Errors are one line starting with `ERR ` and never close the connection:
  `ERR unknown command`, `ERR wrong number of arguments`, `ERR unknown job`.

---

## Part 1 — Submit, Claim, Ack

| Request | Response |
| --- | --- |
| `SUBMIT <payload>` | `ID <n>` — ids start at 1 and increase |
| `CLAIM <worker>` | `JOB <id> <payload>`, or `NONE` if nothing is pending |
| `ACK <id>` | `OK` — the job is complete |
| `STATS` | `STATS pending=<n> claimed=<n> done=<n> dead=<n>` |

- Pending jobs are handed out FIFO.
- A claimed job is not handed to a second worker.
- `ACK` for an id that never existed → `ERR unknown job`. `ACK` for a job that is not
  currently claimed → `ERR not claimed`.

---

## Part 2 — Leases and Redelivery

A claim is a lease, not a transfer of ownership.

- A claimed job whose lease expires (`leaseMs`, default 30s) returns to pending and may
  be claimed again.
- `NACK <id>` → `OK`: return the job to pending immediately. Same error rules as `ACK`.
- `ACK` on a job whose lease already expired → `ERR not claimed`; the redelivered copy
  is the one that counts.
- A redelivered job keeps its original id and payload.

---

## Part 3 — Retries and Dead Letters

Every delivery counts as an attempt.

- After `maxAttempts` (default 3) failed attempts — each `NACK` or lease expiry is one —
  the job stops being redelivered and becomes **dead**.
- `DEAD` → `DEAD <id1> <id2> ...` (ascending, `DEAD` alone if none).
- `RETRY <id>` → `OK` returns a dead job to pending with its attempt count reset;
  `ERR unknown job` if it isn't dead.
- Dead jobs count in `STATS` as `dead`, not `pending` or `claimed`.

---

## Part 4 — Priorities

| Request | Response |
| --- | --- |
| `SUBMITP <priority> <payload>` | `ID <n>` — `<priority>` is an integer, higher is more urgent |

- Plain `SUBMIT` is priority `0`.
- `CLAIM` always returns the highest-priority pending job; ties break FIFO by submission
  order. Redelivered jobs keep their priority and their original position in the tie-break
  order.

---

## Part 5 — Long-Polling Claims and Delayed Jobs

| Request | Response |
| --- | --- |
| `CLAIM <worker> <timeoutMs>` | Wait up to `timeoutMs` for a job. Respond `JOB <id> <payload>` as soon as one is available, or `NONE` when the timeout expires. |
| `DELAY <ms> <payload>` | `ID <n>` — the job becomes claimable only after `<ms>` |

- A waiting worker must be woken by a `SUBMIT` from another connection — no polling loop
  inside the server.
- If several workers are waiting, the one that has waited longest gets the job, and
  exactly one worker gets it.
- A waiting worker that disconnects must not be handed a job (it would vanish).

---

## Running the tests

```
npx jest problems/009_tcp_job_queue
```

Tests configure short leases via `createServer({ leaseMs, maxAttempts })`, so honor
those options rather than hard-coding the defaults.

## Notes

- Say what happens to in-flight jobs if the process dies. Adding durability is the
  natural Part 6 — be ready to sketch it even if you don't build it.
- Be explicit about the data structures behind `CLAIM`: what is O(1), what is O(n), and
  which one bites first at 100k pending jobs.
