# TCP Key-Value Store

Build a Redis-shaped key-value server that clients drive over raw TCP:

```
$ nc localhost 5050
SET greeting hello world
OK
GET greeting
VALUE hello world
```

There is no HTTP and no framework here. You get a byte stream, so **you** own the
framing: one request per `\n`, buffered out of whatever chunks TCP hands you.

## What you implement

Create `server.ts` in this directory:

```ts
export interface KVServerOptions {
  /** Part 5 only: file used to persist and recover state. */
  dataFile?: string;
}

export interface KVServer {
  /** Starts listening. Pass 0 for an ephemeral port. Resolves with the actual port. */
  listen(port: number): Promise<number>;
  /** Closes the listener and every open connection. */
  close(): Promise<void>;
}

export function createServer(options?: KVServerOptions): KVServer;
```

A factory rather than a server that starts on import, because each test needs its own
empty server: `listen(0)` lets the OS pick a free port so parallel tests never collide,
and `close()` lets jest exit. That is test plumbing, not part of the problem.

Make it runnable directly too:

```ts
// Node loads this file as an ES module, so `require.main` does not exist here.
if (process.argv[1]?.endsWith("server.ts")) {
  const port = Number(process.argv[2] ?? 5050);
  createServer({ dataFile: process.argv[3] }).listen(port).then((p) =>
    console.log(`listening on ${p}`),
  );
}
```

Node 22+ runs TypeScript directly — no build step, no `tsx`:

```
node problems/008_tcp_kv_store/server.ts 5050 /tmp/kv.db
```

**Do not use port 5000 on macOS.** AirPlay Receiver listens there, so `nc` connects to
*it* and silently answers nothing — a very convincing fake bug.

## The files

| File | Whose | What |
| --- | --- | --- |
| `README.md` | — | This spec: every request and response string |
| `harness.ts` | provided | A programmable `nc` — `await client.request("GET k")` sends a line and returns the reply. Never edit it. |
| `server.test.ts` | provided | The tests |
| `server.ts` | **you** | The store |

## Protocol

- One UTF-8 request per line, terminated by `\n`; tolerate a trailing `\r`.
- Exactly one response line per request, except where a part says otherwise.
- Command words are case-insensitive (`set`, `SET`, `Set`). Keys are case-sensitive.
- Arguments are space-separated. Where a command takes a value, the value is the
  **rest of the line** and may contain spaces.
- Errors are a single line starting with `ERR `. A bad command must never drop
  the connection.
  - unknown command → `ERR unknown command`
  - wrong argument count → `ERR wrong number of arguments`

---

## Part 1 — Core Commands

| Request | Response |
| --- | --- |
| `SET <key> <value>` | `OK` |
| `GET <key>` | `VALUE <value>`, or `NIL` if absent |
| `DEL <key>` | `DELETED`, or `NIL` if absent |
| `KEYS <prefix>` | `KEYS <k1> <k2> ...` — matching keys, sorted; `KEYS` alone if none match |

State is shared across connections: a key written by one client is visible to all.

---

## Part 2 — Expiry

| Request | Response |
| --- | --- |
| `SETEX <key> <seconds> <value>` | `OK` — set with a TTL. `<seconds>` is a positive integer. |
| `EXPIRE <key> <seconds>` | `OK`, or `NIL` if the key is absent |
| `TTL <key>` | `TTL <n>` seconds remaining (rounded up), `TTL -1` if the key has no expiry, `NIL` if absent |
| `PERSIST <key>` | `OK` (clears any expiry), or `NIL` if absent |

- An expired key is invisible to every command — `GET`, `KEYS`, `TTL`, `DEL` all treat
  it as absent.
- `SET` on an existing key clears its expiry.
- Whether you expire lazily on read, actively on a timer, or both is your call — be
  ready to explain the memory/CPU trade-off you chose.

---

## Part 3 — Atomic Updates

| Request | Response |
| --- | --- |
| `INCR <key> [amount]` | `VALUE <n>` — amount defaults to 1; a missing key starts at 0 |
| `CAS <key> <expected> <new>` | `OK` if the current value matched, `FAIL` otherwise |

- `INCR` on a value that isn't an integer → `ERR not an integer`.
- `CAS` on a missing key → `NIL`.
- `INCR` and `CAS` must be atomic with respect to other connections: N clients each
  issuing M increments always leaves exactly N×M.

---

## Part 4 — Transactions

| Request | Response |
| --- | --- |
| `MULTI` | `OK` — start queueing commands on this connection |
| any command while queueing | `QUEUED` |
| `EXEC` | `EXEC <count>`, then one response line per queued command, in order |
| `DISCARD` | `OK` — drop the queue |

- `MULTI` while already queueing → `ERR multi already started`; `EXEC`/`DISCARD`
  outside a transaction → `ERR no transaction`.
- A queued command that turns out to be invalid still produces its `ERR ...` line
  inside the `EXEC` output — it does not abort the rest.
- The block executes atomically: no other connection observes a half-applied
  transaction.
- Queues are per connection; two clients can be inside `MULTI` at the same time.

---

## Part 5 — Persistence

When `createServer({ dataFile })` is given a path, the server survives a restart.

| Request | Response |
| --- | --- |
| `SAVE` | `OK` — flush current state to `dataFile` |

- A new server opened on the same `dataFile` starts with the saved keys, and with TTLs
  still counting down from real time (a key whose TTL elapsed while the server was down
  comes back already expired).
- A missing or empty `dataFile` is a normal empty start, not an error.
- Choose your format (snapshot vs. append-only log) and be ready to say what you'd lose
  on a crash between writes, and what changes if the file no longer fits in memory.

---

## Running the tests

```
npx jest problems/008_tcp_kv_store
```

Parts are additive here — later parts do not change earlier behavior, so the whole
suite should be green when you finish.
