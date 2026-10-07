import * as net from "node:net";

/**
 * A tiny line-oriented TCP test client: what `nc` gives you, but assertable.
 * Provided for you — you should not need to change anything in this file.
 */
export class Client {
  private buf = "";
  private queue: string[] = [];
  private waiters: Array<(line: string | null) => void> = [];
  private closed = false;

  private constructor(private sock: net.Socket) {
    sock.setEncoding("utf8");
    sock.on("data", (chunk: string) => this.onData(chunk));
    sock.on("close", () => this.onClose());
    sock.on("error", () => this.onClose());
  }

  static connect(port: number, host = "127.0.0.1"): Promise<Client> {
    return new Promise((resolve, reject) => {
      const sock = net.createConnection({ port, host });
      sock.once("connect", () => resolve(new Client(sock)));
      sock.once("error", reject);
    });
  }

  private onData(chunk: string): void {
    this.buf += chunk;
    let idx: number = this.buf.indexOf("\n");
    while (idx !== -1) {
      const line = this.buf.slice(0, idx).replace(/\r$/, "");
      this.buf = this.buf.slice(idx + 1);
      const waiter = this.waiters.shift();
      if (waiter) waiter(line);
      else this.queue.push(line);
      idx = this.buf.indexOf("\n");
    }
  }

  private onClose(): void {
    this.closed = true;
    for (const waiter of this.waiters.splice(0)) waiter(null);
  }

  /** Sends one line, appending the newline terminator. */
  send(line: string): void {
    this.sock.write(`${line}\n`);
  }

  /** Writes bytes verbatim — use it to split a line across packets. */
  raw(data: string): void {
    this.sock.write(data);
  }

  /** Resolves with the next line, or rejects on timeout / server disconnect. */
  readLine(timeoutMs = 1500): Promise<string> {
    const queued = this.queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    if (this.closed) return Promise.reject(new Error("connection closed by server"));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = this.waiters.indexOf(waiter);
        if (i !== -1) this.waiters.splice(i, 1);
        reject(new Error(`timed out after ${timeoutMs}ms waiting for a line`));
      }, timeoutMs);

      const waiter = (line: string | null) => {
        clearTimeout(timer);
        if (line === null) reject(new Error("connection closed by server"));
        else resolve(line);
      };
      this.waiters.push(waiter);
    });
  }

  async readLines(count: number, timeoutMs = 1500): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(await this.readLine(timeoutMs));
    return out;
  }

  /** Fails if any line arrives within the window. */
  async expectSilence(ms = 250): Promise<void> {
    try {
      const line = await this.readLine(ms);
      throw new Error(`expected no output, but received: ${JSON.stringify(line)}`);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("timed out")) return;
      throw err;
    }
  }

  /** Resolves once the server closes the connection. */
  async waitForClose(timeoutMs = 1500): Promise<void> {
    if (this.closed) return;
    try {
      await this.readLine(timeoutMs);
      throw new Error("expected the server to close the connection");
    } catch (err) {
      if (err instanceof Error && err.message === "connection closed by server") return;
      throw err;
    }
  }

  end(): void {
    this.sock.destroy();
  }
}

/** Connects a client and, for Part 2 onward, registers its nickname. */
export async function join(port: number, nick?: string): Promise<Client> {
  const client = await Client.connect(port);
  if (nick !== undefined) {
    client.send(nick);
    const welcome = await client.readLine();
    if (welcome !== `WELCOME ${nick}`) {
      throw new Error(`expected "WELCOME ${nick}", got ${JSON.stringify(welcome)}`);
    }
  }
  return client;
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
