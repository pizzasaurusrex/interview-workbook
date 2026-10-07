import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Client, sleep } from "./harness";
import { createServer, type KVServer } from "./server";

const servers: KVServer[] = [];
const clients: Client[] = [];
let dataFile: string;
let port: number;

/** Starts a server (optionally on the shared data file) and returns its port. */
async function startServer(withDataFile = false): Promise<number> {
  const server = createServer(withDataFile ? { dataFile } : undefined);
  servers.push(server);
  return server.listen(0);
}

async function connect(toPort = port): Promise<Client> {
  const client = await Client.connect(toPort);
  clients.push(client);
  return client;
}

beforeEach(async () => {
  dataFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "kvstore-")), "data.db");
  port = await startServer();
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.end();
  for (const server of servers.splice(0)) await server.close();
});

// ---------------------------------------------------------------------------
// Part 1 — Core Commands
// ---------------------------------------------------------------------------
describe("Part 1 — core commands", () => {
  test("SET then GET round-trips", async () => {
    const c = await connect();
    expect(await c.request("SET name sean")).toBe("OK");
    expect(await c.request("GET name")).toBe("VALUE sean");
  });

  test("a value may contain spaces", async () => {
    const c = await connect();
    await c.request("SET greeting hello there world");
    expect(await c.request("GET greeting")).toBe("VALUE hello there world");
  });

  test("GET on a missing key is NIL", async () => {
    const c = await connect();
    expect(await c.request("GET nope")).toBe("NIL");
  });

  test("SET overwrites", async () => {
    const c = await connect();
    await c.request("SET k one");
    await c.request("SET k two");
    expect(await c.request("GET k")).toBe("VALUE two");
  });

  test("DEL removes a key once", async () => {
    const c = await connect();
    await c.request("SET k v");
    expect(await c.request("DEL k")).toBe("DELETED");
    expect(await c.request("DEL k")).toBe("NIL");
    expect(await c.request("GET k")).toBe("NIL");
  });

  test("KEYS lists matching keys in sorted order", async () => {
    const c = await connect();
    await c.request("SET user:carol 3");
    await c.request("SET user:alice 1");
    await c.request("SET user:bob 2");
    await c.request("SET session:x 9");

    expect(await c.request("KEYS user:")).toBe("KEYS user:alice user:bob user:carol");
    expect(await c.request("KEYS nothing")).toBe("KEYS");
  });

  test("command words are case-insensitive, keys are not", async () => {
    const c = await connect();
    await c.request("set Key value");
    expect(await c.request("gEt Key")).toBe("VALUE value");
    expect(await c.request("GET key")).toBe("NIL");
  });

  test("state is shared across connections", async () => {
    const a = await connect();
    const b = await connect();
    await a.request("SET shared yes");
    expect(await b.request("GET shared")).toBe("VALUE yes");
  });

  test("bad input errors without dropping the connection", async () => {
    const c = await connect();
    expect(await c.request("FLY me to the moon")).toBe("ERR unknown command");
    expect(await c.request("GET")).toBe("ERR wrong number of arguments");
    expect(await c.request("SET lonely")).toBe("ERR wrong number of arguments");
    expect(await c.request("SET still working")).toBe("OK");
  });
});

// ---------------------------------------------------------------------------
// Part 2 — Expiry
// ---------------------------------------------------------------------------
describe("Part 2 — expiry", () => {
  test("SETEX stores a readable value with a TTL", async () => {
    const c = await connect();
    expect(await c.request("SETEX temp 5 some value")).toBe("OK");
    expect(await c.request("GET temp")).toBe("VALUE some value");
    expect(await c.request("TTL temp")).toBe("TTL 5");
  });

  test("a key disappears once its TTL elapses", async () => {
    const c = await connect();
    await c.request("SETEX blink 1 gone soon");
    await sleep(1200);
    expect(await c.request("GET blink")).toBe("NIL");
    expect(await c.request("TTL blink")).toBe("NIL");
    expect(await c.request("KEYS blink")).toBe("KEYS");
    expect(await c.request("DEL blink")).toBe("NIL");
  });

  test("TTL reports -1 for a key with no expiry and NIL when absent", async () => {
    const c = await connect();
    await c.request("SET permanent v");
    expect(await c.request("TTL permanent")).toBe("TTL -1");
    expect(await c.request("TTL missing")).toBe("NIL");
  });

  test("EXPIRE adds a TTL to an existing key only", async () => {
    const c = await connect();
    await c.request("SET k v");
    expect(await c.request("EXPIRE k 30")).toBe("OK");
    expect(await c.request("TTL k")).toBe("TTL 30");
    expect(await c.request("EXPIRE missing 30")).toBe("NIL");
  });

  test("PERSIST clears a TTL", async () => {
    const c = await connect();
    await c.request("SETEX k 30 v");
    expect(await c.request("PERSIST k")).toBe("OK");
    expect(await c.request("TTL k")).toBe("TTL -1");
    expect(await c.request("PERSIST missing")).toBe("NIL");
  });

  test("SET clears an existing TTL", async () => {
    const c = await connect();
    await c.request("SETEX k 1 old");
    await c.request("SET k new");
    await sleep(1200);
    expect(await c.request("GET k")).toBe("VALUE new");
    expect(await c.request("TTL k")).toBe("TTL -1");
  });
});

// ---------------------------------------------------------------------------
// Part 3 — Atomic Updates
// ---------------------------------------------------------------------------
describe("Part 3 — atomic updates", () => {
  test("INCR starts a missing key at zero", async () => {
    const c = await connect();
    expect(await c.request("INCR counter")).toBe("VALUE 1");
    expect(await c.request("INCR counter")).toBe("VALUE 2");
  });

  test("INCR accepts an explicit amount, including negative", async () => {
    const c = await connect();
    expect(await c.request("INCR counter 10")).toBe("VALUE 10");
    expect(await c.request("INCR counter -4")).toBe("VALUE 6");
  });

  test("INCR rejects a non-integer value", async () => {
    const c = await connect();
    await c.request("SET word hello");
    expect(await c.request("INCR word")).toBe("ERR not an integer");
    expect(await c.request("GET word")).toBe("VALUE hello");
  });

  test("CAS swaps only on an exact match", async () => {
    const c = await connect();
    await c.request("SET k one");
    expect(await c.request("CAS k two three")).toBe("FAIL");
    expect(await c.request("GET k")).toBe("VALUE one");
    expect(await c.request("CAS k one two")).toBe("OK");
    expect(await c.request("GET k")).toBe("VALUE two");
    expect(await c.request("CAS missing a b")).toBe("NIL");
  });

  test("concurrent INCRs from many connections do not lose updates", async () => {
    const clientCount = 20;
    const perClient = 25;
    const workers = await Promise.all(Array.from({ length: clientCount }, () => connect()));

    await Promise.all(
      workers.map(async (worker) => {
        for (let i = 0; i < perClient; i++) await worker.request("INCR hits", 5000);
      }),
    );

    const c = await connect();
    expect(await c.request("GET hits")).toBe(`VALUE ${clientCount * perClient}`);
  }, 20000);
});

// ---------------------------------------------------------------------------
// Part 4 — Transactions
// ---------------------------------------------------------------------------
describe("Part 4 — transactions", () => {
  test("queued commands run in order on EXEC", async () => {
    const c = await connect();
    expect(await c.request("MULTI")).toBe("OK");
    expect(await c.request("SET a 1")).toBe("QUEUED");
    expect(await c.request("INCR a")).toBe("QUEUED");
    expect(await c.request("GET a")).toBe("QUEUED");

    c.send("EXEC");
    expect(await c.readLines(4)).toEqual(["EXEC 3", "OK", "VALUE 2", "VALUE 2"]);
  });

  test("nothing is applied until EXEC", async () => {
    const a = await connect();
    const b = await connect();

    await a.request("MULTI");
    await a.request("SET pending yes");
    expect(await b.request("GET pending")).toBe("NIL");

    a.send("EXEC");
    await a.readLines(2);
    expect(await b.request("GET pending")).toBe("VALUE yes");
  });

  test("DISCARD throws the queue away", async () => {
    const c = await connect();
    await c.request("MULTI");
    await c.request("SET discarded yes");
    expect(await c.request("DISCARD")).toBe("OK");
    expect(await c.request("GET discarded")).toBe("NIL");
  });

  test("a failing command reports inside EXEC without aborting the rest", async () => {
    const c = await connect();
    await c.request("SET word hello");
    await c.request("MULTI");
    await c.request("INCR word");
    await c.request("SET after ok");

    c.send("EXEC");
    expect(await c.readLines(3)).toEqual(["EXEC 2", "ERR not an integer", "OK"]);
    expect(await c.request("GET after")).toBe("VALUE ok");
  });

  test("MULTI/EXEC misuse is rejected", async () => {
    const c = await connect();
    expect(await c.request("EXEC")).toBe("ERR no transaction");
    expect(await c.request("DISCARD")).toBe("ERR no transaction");
    await c.request("MULTI");
    expect(await c.request("MULTI")).toBe("ERR multi already started");
  });

  test("transactions are per connection", async () => {
    const a = await connect();
    const b = await connect();

    await a.request("MULTI");
    await a.request("SET fromA 1");
    expect(await b.request("SET fromB 1")).toBe("OK");

    a.send("EXEC");
    expect(await a.readLines(2)).toEqual(["EXEC 1", "OK"]);
    expect(await b.request("GET fromA")).toBe("VALUE 1");
  });
});

// ---------------------------------------------------------------------------
// Part 5 — Persistence
// ---------------------------------------------------------------------------
describe("Part 5 — persistence", () => {
  test("saved keys come back after a restart", async () => {
    const firstPort = await startServer(true);
    const first = await connect(firstPort);
    await first.request("SET durable yes");
    await first.request("SET other thing");
    expect(await first.request("SAVE")).toBe("OK");
    await servers[servers.length - 1].close();

    const secondPort = await startServer(true);
    const second = await connect(secondPort);
    expect(await second.request("GET durable")).toBe("VALUE yes");
    expect(await second.request("GET other")).toBe("VALUE thing");
  });

  test("an empty or missing data file starts clean", async () => {
    const freshPort = await startServer(true);
    const c = await connect(freshPort);
    expect(await c.request("GET anything")).toBe("NIL");
    expect(await c.request("SAVE")).toBe("OK");
  });

  test("TTLs keep counting down across a restart", async () => {
    const firstPort = await startServer(true);
    const first = await connect(firstPort);
    await first.request("SETEX slow 30 still here");
    await first.request("SETEX quick 1 not for long");
    await first.request("SAVE");
    await servers[servers.length - 1].close();

    await sleep(1200);

    const secondPort = await startServer(true);
    const second = await connect(secondPort);
    expect(await second.request("GET slow")).toBe("VALUE still here");
    const remaining = Number((await second.request("TTL slow")).split(" ")[1]);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(30);
    expect(await second.request("GET quick")).toBe("NIL");
  });
});
