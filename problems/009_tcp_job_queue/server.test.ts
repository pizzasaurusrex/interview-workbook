import { Client, sleep } from "./harness";
import { createServer, type QueueOptions, type QueueServer } from "./server";

const servers: QueueServer[] = [];
const clients: Client[] = [];
let port: number;

async function startServer(options?: QueueOptions): Promise<number> {
  const server = createServer(options);
  servers.push(server);
  return server.listen(0);
}

async function connect(toPort = port): Promise<Client> {
  const client = await Client.connect(toPort);
  clients.push(client);
  return client;
}

beforeEach(async () => {
  port = await startServer();
});

afterEach(async () => {
  for (const client of clients.splice(0)) client.end();
  for (const server of servers.splice(0)) await server.close();
});

// ---------------------------------------------------------------------------
// Part 1 — Submit, Claim, Ack
// ---------------------------------------------------------------------------
describe("Part 1 — submit, claim, ack", () => {
  test("SUBMIT returns increasing ids", async () => {
    const c = await connect();
    expect(await c.request("SUBMIT first job")).toBe("ID 1");
    expect(await c.request("SUBMIT second job")).toBe("ID 2");
  });

  test("CLAIM hands out pending jobs FIFO", async () => {
    const producer = await connect();
    await producer.request("SUBMIT resize avatar.png");
    await producer.request("SUBMIT send email");

    const worker = await connect();
    expect(await worker.request("CLAIM w1")).toBe("JOB 1 resize avatar.png");
    expect(await worker.request("CLAIM w1")).toBe("JOB 2 send email");
    expect(await worker.request("CLAIM w1")).toBe("NONE");
  });

  test("a claimed job is not handed to a second worker", async () => {
    const producer = await connect();
    await producer.request("SUBMIT only one");

    const a = await connect();
    const b = await connect();
    expect(await a.request("CLAIM w1")).toBe("JOB 1 only one");
    expect(await b.request("CLAIM w2")).toBe("NONE");
  });

  test("ACK completes a claimed job", async () => {
    const c = await connect();
    await c.request("SUBMIT work");
    await c.request("CLAIM w1");
    expect(await c.request("ACK 1")).toBe("OK");
    expect(await c.request("ACK 1")).toBe("ERR not claimed");
    expect(await c.request("ACK 99")).toBe("ERR unknown job");
  });

  test("ACK on a pending job is rejected", async () => {
    const c = await connect();
    await c.request("SUBMIT work");
    expect(await c.request("ACK 1")).toBe("ERR not claimed");
  });

  test("STATS counts each state", async () => {
    const c = await connect();
    expect(await c.request("STATS")).toBe("STATS pending=0 claimed=0 done=0 dead=0");

    await c.request("SUBMIT a");
    await c.request("SUBMIT b");
    await c.request("CLAIM w1");
    expect(await c.request("STATS")).toBe("STATS pending=1 claimed=1 done=0 dead=0");

    await c.request("ACK 1");
    expect(await c.request("STATS")).toBe("STATS pending=1 claimed=0 done=1 dead=0");
  });
});

// ---------------------------------------------------------------------------
// Part 2 — Leases and Redelivery
// ---------------------------------------------------------------------------
describe("Part 2 — leases and redelivery", () => {
  test("an expired lease returns the job to pending, id and payload intact", async () => {
    const shortLease = await startServer({ leaseMs: 300 });
    const c = await connect(shortLease);
    await c.request("SUBMIT slow work here");
    expect(await c.request("CLAIM w1")).toBe("JOB 1 slow work here");
    expect(await c.request("CLAIM w2")).toBe("NONE");

    await sleep(500);
    expect(await c.request("CLAIM w2")).toBe("JOB 1 slow work here");
  });

  test("ACK after the lease expired is rejected", async () => {
    const shortLease = await startServer({ leaseMs: 300 });
    const c = await connect(shortLease);
    await c.request("SUBMIT work");
    await c.request("CLAIM w1");

    await sleep(500);
    expect(await c.request("ACK 1")).toBe("ERR not claimed");
    expect(await c.request("STATS")).toBe("STATS pending=1 claimed=0 done=0 dead=0");
  });

  test("NACK requeues immediately", async () => {
    const c = await connect();
    await c.request("SUBMIT work");
    await c.request("CLAIM w1");
    expect(await c.request("NACK 1")).toBe("OK");
    expect(await c.request("CLAIM w2")).toBe("JOB 1 work");
    expect(await c.request("NACK 99")).toBe("ERR unknown job");
  });

  test("an acked job is never redelivered", async () => {
    const shortLease = await startServer({ leaseMs: 300 });
    const c = await connect(shortLease);
    await c.request("SUBMIT work");
    await c.request("CLAIM w1");
    await c.request("ACK 1");

    await sleep(500);
    expect(await c.request("CLAIM w2")).toBe("NONE");
  });
});

// ---------------------------------------------------------------------------
// Part 3 — Retries and Dead Letters
// ---------------------------------------------------------------------------
describe("Part 3 — retries and dead letters", () => {
  test("a job dies after maxAttempts failures", async () => {
    const p = await startServer({ maxAttempts: 2 });
    const c = await connect(p);
    await c.request("SUBMIT poison");

    await c.request("CLAIM w1");
    await c.request("NACK 1");
    expect(await c.request("CLAIM w1")).toBe("JOB 1 poison");
    await c.request("NACK 1");

    expect(await c.request("CLAIM w1")).toBe("NONE");
    expect(await c.request("DEAD")).toBe("DEAD 1");
    expect(await c.request("STATS")).toBe("STATS pending=0 claimed=0 done=0 dead=1");
  });

  test("lease expiries count as attempts too", async () => {
    const p = await startServer({ leaseMs: 200, maxAttempts: 2 });
    const c = await connect(p);
    await c.request("SUBMIT poison");

    await c.request("CLAIM w1");
    await sleep(350);
    expect(await c.request("CLAIM w2")).toBe("JOB 1 poison");
    await sleep(350);

    expect(await c.request("CLAIM w3")).toBe("NONE");
    expect(await c.request("DEAD")).toBe("DEAD 1");
  });

  test("DEAD is empty until something dies", async () => {
    const c = await connect();
    expect(await c.request("DEAD")).toBe("DEAD");
  });

  test("RETRY revives a dead job with a fresh attempt budget", async () => {
    const p = await startServer({ maxAttempts: 1 });
    const c = await connect(p);
    await c.request("SUBMIT flaky");
    await c.request("CLAIM w1");
    await c.request("NACK 1");
    expect(await c.request("DEAD")).toBe("DEAD 1");

    expect(await c.request("RETRY 1")).toBe("OK");
    expect(await c.request("DEAD")).toBe("DEAD");
    expect(await c.request("CLAIM w2")).toBe("JOB 1 flaky");
    expect(await c.request("ACK 1")).toBe("OK");
  });

  test("RETRY on a job that is not dead is rejected", async () => {
    const c = await connect();
    await c.request("SUBMIT work");
    expect(await c.request("RETRY 1")).toBe("ERR unknown job");
    expect(await c.request("RETRY 99")).toBe("ERR unknown job");
  });
});

// ---------------------------------------------------------------------------
// Part 4 — Priorities
// ---------------------------------------------------------------------------
describe("Part 4 — priorities", () => {
  test("higher priority is claimed first", async () => {
    const c = await connect();
    await c.request("SUBMIT normal");
    await c.request("SUBMITP 5 urgent");
    await c.request("SUBMITP -1 whenever");

    expect(await c.request("CLAIM w1")).toBe("JOB 2 urgent");
    expect(await c.request("CLAIM w1")).toBe("JOB 1 normal");
    expect(await c.request("CLAIM w1")).toBe("JOB 3 whenever");
  });

  test("equal priorities stay FIFO", async () => {
    const c = await connect();
    await c.request("SUBMITP 3 first");
    await c.request("SUBMITP 3 second");
    await c.request("SUBMITP 3 third");

    expect(await c.request("CLAIM w1")).toBe("JOB 1 first");
    expect(await c.request("CLAIM w1")).toBe("JOB 2 second");
    expect(await c.request("CLAIM w1")).toBe("JOB 3 third");
  });

  test("a requeued job keeps its priority", async () => {
    const c = await connect();
    await c.request("SUBMITP 9 important");
    await c.request("CLAIM w1");
    await c.request("NACK 1");
    await c.request("SUBMIT ordinary");

    expect(await c.request("CLAIM w2")).toBe("JOB 1 important");
  });
});

// ---------------------------------------------------------------------------
// Part 5 — Long-Polling Claims and Delayed Jobs
// ---------------------------------------------------------------------------
describe("Part 5 — long-polling claims and delayed jobs", () => {
  test("a waiting claim is woken by a later submit", async () => {
    const worker = await connect();
    const producer = await connect();

    worker.send("CLAIM w1 2000");
    await worker.expectSilence(200);

    await producer.request("SUBMIT arrived late");
    expect(await worker.readLine(1000)).toBe("JOB 1 arrived late");
  });

  test("a waiting claim gives up with NONE", async () => {
    const worker = await connect();
    const started = Date.now();
    expect(await worker.request("CLAIM w1 400", 2000)).toBe("NONE");
    expect(Date.now() - started).toBeGreaterThanOrEqual(350);
  });

  test("an already pending job returns immediately", async () => {
    const c = await connect();
    await c.request("SUBMIT ready now");
    const started = Date.now();
    expect(await c.request("CLAIM w1 5000")).toBe("JOB 1 ready now");
    expect(Date.now() - started).toBeLessThan(500);
  });

  test("exactly one of several waiting workers gets the job, longest wait first", async () => {
    const first = await connect();
    const second = await connect();
    const producer = await connect();

    first.send("CLAIM w1 2000");
    await sleep(100);
    second.send("CLAIM w2 2000");
    await sleep(100);

    await producer.request("SUBMIT single unit of work");
    expect(await first.readLine(1000)).toBe("JOB 1 single unit of work");
    await second.expectSilence(300);
  });

  test("DELAY hides a job until its delay elapses", async () => {
    const c = await connect();
    expect(await c.request("DELAY 400 later")).toBe("ID 1");
    expect(await c.request("CLAIM w1")).toBe("NONE");

    await sleep(600);
    expect(await c.request("CLAIM w1")).toBe("JOB 1 later");
  });

  test("a delayed job wakes a waiting worker", async () => {
    const worker = await connect();
    const producer = await connect();

    await producer.request("DELAY 300 scheduled");
    worker.send("CLAIM w1 2000");
    expect(await worker.readLine(1500)).toBe("JOB 1 scheduled");
  });
});
