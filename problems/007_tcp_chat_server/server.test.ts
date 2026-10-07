import { Client, join, sleep } from "./harness";
import { type ChatServer, createServer } from "./server";

let server: ChatServer;
let port: number;
const clients: Client[] = [];

async function connect(nick?: string): Promise<Client> {
  const client = await join(port, nick);
  clients.push(client);
  return client;
}

beforeEach(async () => {
  server = createServer();
  port = await server.listen(0);
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.end();
  await server.close();
});

// ---------------------------------------------------------------------------
// Part 1 — Concurrent Echo
// Part 2 replaces echo with nicknames + broadcast. Once you start Part 2,
// change this to `describe.skip`.
// ---------------------------------------------------------------------------
describe("Part 1 — concurrent echo", () => {
  test("echoes a line back to the sender", async () => {
    const a = await connect();
    a.send("hello");
    expect(await a.readLine()).toBe("hello");
  });

  test("handles several lines arriving in one packet", async () => {
    const a = await connect();
    a.raw("one\ntwo\nthree\n");
    expect(await a.readLines(3)).toEqual(["one", "two", "three"]);
  });

  test("handles one line split across packets", async () => {
    const a = await connect();
    a.raw("par");
    await sleep(50);
    a.raw("tial\n");
    expect(await a.readLine()).toBe("partial");
  });

  test("strips a trailing carriage return", async () => {
    const a = await connect();
    a.raw("telnet\r\n");
    expect(await a.readLine()).toBe("telnet");
  });

  test("serves concurrent clients independently", async () => {
    const a = await connect();
    const b = await connect();
    a.send("from-a");
    b.send("from-b");
    expect(await a.readLine()).toBe("from-a");
    expect(await b.readLine()).toBe("from-b");
  });

  test("survives a client disconnecting mid-session", async () => {
    const a = await connect();
    const b = await connect();
    a.end();
    await sleep(50);
    b.send("still here");
    expect(await b.readLine()).toBe("still here");
  });
});

// ---------------------------------------------------------------------------
// Part 2 — Nicknames and Broadcast
// ---------------------------------------------------------------------------
describe("Part 2 — nicknames and broadcast", () => {
  test("first line registers the nickname", async () => {
    const a = await Client.connect(port);
    clients.push(a);
    a.send("alice");
    expect(await a.readLine()).toBe("WELCOME alice");
  });

  test("announces a join to everyone already connected", async () => {
    const a = await connect("alice");
    await connect("bob");
    expect(await a.readLine()).toBe("* bob joined");
  });

  test("broadcasts a message to others but not the sender", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    a.send("hey everyone");
    expect(await b.readLine()).toBe("alice: hey everyone");
    await a.expectSilence();
  });

  test("announces a departure", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    b.end();
    expect(await a.readLine()).toBe("* bob left");
  });

  test("rejects a duplicate nickname and accepts a retry", async () => {
    await connect("alice");
    const b = await Client.connect(port);
    clients.push(b);

    b.send("alice");
    expect(await b.readLine()).toBe("ERR nickname taken");
    b.send("bob");
    expect(await b.readLine()).toBe("WELCOME bob");
  });

  test("rejects a blank nickname", async () => {
    const a = await Client.connect(port);
    clients.push(a);
    a.send("   ");
    expect(await a.readLine()).toBe("ERR invalid nickname");
  });
});

// ---------------------------------------------------------------------------
// Part 3 — Commands
// ---------------------------------------------------------------------------
describe("Part 3 — commands", () => {
  test("/nick renames and tells the room", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    b.send("/nick robert");
    expect(await b.readLine()).toBe("OK nick robert");
    expect(await a.readLine()).toBe("* bob is now robert");
  });

  test("/nick rejects a name already in use", async () => {
    await connect("alice");
    const b = await connect("bob");
    b.send("/nick alice");
    expect(await b.readLine()).toBe("ERR nickname taken");
  });

  test("/who lists everyone alphabetically", async () => {
    const a = await connect("carol");
    await connect("alice");
    await connect("bob");
    await a.readLines(2); // "* alice joined", "* bob joined"

    a.send("/who");
    expect(await a.readLine()).toBe("USERS alice bob carol");
  });

  test("/msg delivers privately", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    const c = await connect("carol");
    await a.readLines(2); // bob + carol joined
    await b.readLine(); // carol joined

    a.send("/msg bob psst");
    expect(await a.readLine()).toBe("OK sent");
    expect(await b.readLine()).toBe("[pm] alice: psst");
    await c.expectSilence();
  });

  test("/msg to an unknown user errors", async () => {
    const a = await connect("alice");
    a.send("/msg nobody hello");
    expect(await a.readLine()).toBe("ERR no such user");
  });

  test("/quit says goodbye and closes the connection", async () => {
    const a = await connect("alice");
    a.send("/quit");
    expect(await a.readLine()).toBe("BYE");
    await a.waitForClose();
  });

  test("unknown commands are rejected", async () => {
    const a = await connect("alice");
    a.send("/dance");
    expect(await a.readLine()).toBe("ERR unknown command");
  });

  test("a message with a slash inside is still chat", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine();

    a.send("look at http://x/y");
    expect(await b.readLine()).toBe("alice: look at http://x/y");
  });
});

// ---------------------------------------------------------------------------
// Part 4 — Rooms
// ---------------------------------------------------------------------------
describe("Part 4 — rooms", () => {
  test("/join moves the client and notifies both rooms", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    b.send("/join rust");
    expect(await b.readLine()).toBe("OK joined rust");
    expect(await a.readLine()).toBe("* bob left");
  });

  test("broadcast is scoped to the sender's room", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    const c = await connect("carol");
    await a.readLines(2);
    await b.readLine();

    b.send("/join rust");
    expect(await b.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* bob left"
    await c.readLine(); // "* bob left"

    c.send("/join rust");
    expect(await c.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* carol left"
    expect(await b.readLine()).toBe("* carol joined");

    c.send("hello rustaceans");
    expect(await b.readLine()).toBe("carol: hello rustaceans");
    await a.expectSilence();
  });

  test("/who is scoped to the sender's room", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine();

    b.send("/join rust");
    expect(await b.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* bob left"

    b.send("/who");
    expect(await b.readLine()).toBe("USERS bob");

    a.send("/who");
    expect(await a.readLine()).toBe("USERS alice");
  });

  test("/rooms reports occupied rooms with member counts", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    const c = await connect("carol");
    await a.readLines(2);
    await b.readLine();

    b.send("/join rust");
    expect(await b.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* bob left"
    await c.readLine(); // "* bob left"

    c.send("/join rust");
    expect(await c.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* carol left"
    await b.readLine(); // "* carol joined"

    a.send("/rooms");
    expect(await a.readLine()).toBe("ROOMS lobby:1 rust:2");
  });

  test("/msg still crosses rooms", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine();

    b.send("/join rust");
    expect(await b.readLine()).toBe("OK joined rust");
    await a.readLine(); // "* bob left"

    a.send("/msg bob still reachable");
    expect(await a.readLine()).toBe("OK sent");
    expect(await b.readLine()).toBe("[pm] alice: still reachable");
  });
});

// ---------------------------------------------------------------------------
// Part 5 — History and Rate Limiting
// ---------------------------------------------------------------------------
describe("Part 5 — history and rate limiting", () => {
  test("replays room history on /join, oldest first, then confirms", async () => {
    const a = await connect("alice");
    a.send("/join rust");
    expect(await a.readLine()).toBe("OK joined rust");
    a.send("first");
    a.send("second");
    await sleep(100);

    const b = await connect("bob");
    b.send("/join rust");
    expect(await b.readLines(3)).toEqual([
      "HIST alice: first",
      "HIST alice: second",
      "OK joined rust",
    ]);
  });

  test("history holds at most the last 20 messages", async () => {
    // Five senders, five messages each — 25 messages without tripping the rate limit.
    const senders: Client[] = [];
    for (let s = 0; s < 5; s++) {
      const sender = await connect(`u${s}`);
      sender.send("/join rust");
      senders.push(sender);
    }
    await sleep(100);

    const expected: string[] = [];
    for (let i = 1; i <= 25; i++) {
      const s = Math.floor((i - 1) / 5);
      senders[s].send(`m${i}`);
      if (i > 5) expected.push(`HIST u${s}: m${i}`);
      await sleep(10);
    }
    expected.push("OK joined rust");

    const observer = await connect("bob");
    observer.send("/join rust");
    expect(await observer.readLines(21, 3000)).toEqual(expected);
  }, 15000);

  test("join/leave notices are not stored as history", async () => {
    const a = await connect("alice");
    a.send("/join rust");
    await a.readLine();
    a.send("only message");
    await sleep(100);

    const b = await connect("bob");
    b.send("/join rust");
    expect(await b.readLines(2)).toEqual(["HIST alice: only message", "OK joined rust"]);
  });

  test("drops chat past 5 messages per 10 seconds and tells only the sender", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    for (let i = 1; i <= 5; i++) a.send(`msg${i}`);
    expect(await b.readLines(5)).toEqual([
      "alice: msg1",
      "alice: msg2",
      "alice: msg3",
      "alice: msg4",
      "alice: msg5",
    ]);

    a.send("msg6");
    expect(await a.readLine()).toBe("ERR rate limited");
    await b.expectSilence(500);
  });

  test("commands are not rate limited", async () => {
    const a = await connect("alice");
    for (let i = 1; i <= 5; i++) a.send(`msg${i}`);
    await sleep(100);

    for (let i = 0; i < 3; i++) {
      a.send("/who");
      expect(await a.readLine()).toBe("USERS alice");
    }
  });

  test("the limit is per client, not global", async () => {
    const a = await connect("alice");
    const b = await connect("bob");
    await a.readLine(); // "* bob joined"

    for (let i = 1; i <= 5; i++) a.send(`msg${i}`);
    await a.expectSilence(300);

    b.send("bob is fine");
    expect(await a.readLine()).toBe("bob: bob is fine");
  });
});
