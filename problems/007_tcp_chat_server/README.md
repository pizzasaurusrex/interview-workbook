# TCP Chat Server

Build an IRC-style chat room that several people connect to with `nc`. One server
process holds every open socket; a line typed by one client appears on the others.

```
$ nc localhost 5050          $ nc localhost 5050
alice                        bob
WELCOME alice                WELCOME bob
* bob joined
hey                          alice: hey
                             /who
                             USERS alice bob
```

There is no HTTP and no framework here. You get a byte stream, so **you** own the
framing: `"hel"` and `"lo\nbob\n"` can arrive as two separate `data` events, and you
buffer until you find a `\n`.

## What you implement

Create `server.ts` in this directory. It must export a factory:

```ts
export interface ChatServer {
  /** Starts listening. Pass 0 to get an ephemeral port. Resolves with the actual port. */
  listen(port: number): Promise<number>;
  /** Closes the listener and every open connection. */
  close(): Promise<void>;
}

export function createServer(): ChatServer;
```

A factory rather than a server that starts on import, because each test needs its own
empty server: `listen(0)` lets the OS pick a free port so parallel tests never collide,
and `close()` lets jest exit. That is test plumbing — it has nothing to do with chat.

Also make the file runnable directly so you can drive it with `nc` while you work:

```ts
// Node loads this file as an ES module, so `require.main` does not exist here.
if (process.argv[1]?.endsWith("server.ts")) {
  const port = Number(process.argv[2] ?? 5050);
  createServer().listen(port).then((p) => console.log(`listening on ${p}`));
}
```

Node 22+ runs TypeScript directly — no build step, no `tsx`:

```
node problems/007_tcp_chat_server/server.ts 5050
```

**Do not use port 5000 on macOS.** AirPlay Receiver already listens there, so `nc` will
connect to *it*, accept everything you type, and answer nothing — a very convincing fake
bug. Use 5050, or turn AirPlay Receiver off in System Settings.

## The files

| File | Whose | What |
| --- | --- | --- |
| `README.md` | — | This spec: every request and response string |
| `harness.ts` | provided | A programmable `nc` — connects, buffers bytes, splits on `\n`, and lets a test `await client.readLine()`. Never edit it. |
| `server.test.ts` | provided | The tests |
| `server.ts` | **you** | The chat server |

## Protocol

- Raw TCP, no framing beyond newlines.
- Every message in both directions is one UTF-8 line terminated by `\n`.
- Clients may send `\r\n` (telnet and PuTTY do) — strip the `\r`.
- A client's line may arrive split across several packets, and several lines may
  arrive in one packet. Buffer accordingly.

---

## Part 1 — Concurrent Echo

Accept many simultaneous connections. Echo each received line back to the sender
verbatim, followed by `\n`.

- A slow or idle client must never block another client.
- One client disconnecting must not affect the others or crash the server.

---

## Part 2 — Nicknames and Broadcast

The **first** line a client sends is its nickname.

- Reply `WELCOME <nick>` to that client.
- Send `* <nick> joined` to everyone else already connected.
- Every later line is broadcast to all *other* clients as `<nick>: <text>`. The
  sender does not get a copy of their own message. (So with a single `nc` open, typing
  produces no output at all — that is this rule, not a bug. Open a second one.)
- On disconnect, send `* <nick> left` to everyone else.
- Nicknames are unique. If one is taken, reply `ERR nickname taken` and keep
  waiting for a different one.
- Empty or whitespace-only nicknames get `ERR invalid nickname`.

---

## Part 3 — Commands

A line starting with `/` is a command, not a chat message.

| Command | Behavior |
| --- | --- |
| `/nick <name>` | Rename. `OK nick <name>` to the sender; `* <old> is now <new>` to everyone else. Same validation as Part 2. |
| `/who` | Reply `USERS <nick1> <nick2> ...`, sorted alphabetically, including the sender. |
| `/msg <nick> <text>` | Recipient gets `[pm] <sender>: <text>`, sender gets `OK sent`. Unknown recipient gets `ERR no such user`. |
| `/quit` | Reply `BYE`, then close the connection. |

Anything else starting with `/` gets `ERR unknown command`.

---

## Part 4 — Rooms

Clients start in room `lobby`. Broadcast is scoped to the sender's room.

| Command | Behavior |
| --- | --- |
| `/join <room>` | Leave the current room, join `<room>` (creating it if needed), reply `OK joined <room>`. The old room hears `* <nick> left`, the new room hears `* <nick> joined`. |
| `/rooms` | Reply `ROOMS <name>:<count> ...`, sorted by room name. Rooms with no members are not listed. |

`/who` now lists only the sender's room. `/msg` still reaches any room.

---

## Part 5 — History and Backpressure

- Keep the last **20** chat messages per room (chat only — join/leave notices are not
  history). Replay is oldest-first, one line each, formatted `HIST <nick>: <text>`.
  - On `/join <room>`: history first, then `OK joined <room>`.
  - On connecting: `WELCOME <nick>` first, then the `lobby` history.
- Rate limit: at most **5** chat messages per client per rolling 10 seconds. Excess
  messages are dropped, and only the sender is told `ERR rate limited`. Commands are
  not rate limited.
- A client that stops reading must not stall the server. Give each connection a
  bounded outbound buffer; on overflow, send `ERR too slow` and drop that client.

---

The backpressure rule is deliberately not covered by the tests — demonstrate it by
hand (connect with `nc`, suspend it with Ctrl-Z, flood the room) and be ready to
explain how you'd test it.

---

## Running the tests

```
npx jest problems/007_tcp_chat_server
```

Parts are cumulative, so **Part 2 replaces echo behavior** — once you start Part 2,
switch the Part 1 suite to `describe.skip`.

## Notes

- Choose your concurrency/backpressure approach deliberately — that trade-off is the
  point of Parts 1 and 5, not an implementation detail.
- Shared state (nick registry, room membership) is touched by every connection. Be
  able to say what invariants you're maintaining and where.
- Drive it by hand with two `nc` sessions before trusting the tests.
