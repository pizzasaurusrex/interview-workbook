# Interview Workbook

Practice problems for coding interviews. Each one has a problem statement, a test
suite, and an empty solution for you to fill in. Nothing is solved for you: the
tests start out failing, and you're done when they pass.

## Setup

You need **Node 22+** (the TCP problems run `.ts` files directly) and **Python 3.9+**.

```sh
npm install
pip install -r requirements.txt
```

## Running tests

```sh
# Python problems
python3 -m pytest problems/002_flatten_nested_dict

# TypeScript problems
npx jest problems/008_tcp_kv_store
```

Run `npm test` or `python3 -m pytest` with no path to run everything.

## Problems

| # | Problem | Language | What it exercises |
| --- | --- | --- | --- |
| 001 | [Meeting Scheduler](problems/001_meeting_scheduler) | Python or TS | Interval overlap |
| 002 | [Flatten a Nested Dictionary](problems/002_flatten_nested_dict) | Python | Recursion |
| 003 | [Top K Most Active Candidates](problems/003_top_k_candidates) | Python | Counting, heaps |
| 004 | [Recruiting Platform](problems/004_recruiting_platform) | Python | Adding a feature to an existing codebase |
| 005 | [Feature Flag Service](problems/005_feature_flag_service) | Python | Weighted sampling, deterministic hashing, versioned state |
| 006 | [Calendar Availability](problems/006_calendar_availability) | Python | Datetime intervals |
| 007 | [TCP Chat Server](problems/007_tcp_chat_server) | TypeScript | Sockets, framing, broadcast |
| 008 | [TCP Key-Value Store](problems/008_tcp_kv_store) | TypeScript | Sockets, protocol design |
| 009 | [TCP Job Queue](problems/009_tcp_job_queue) | TypeScript | Sockets, work distribution |
| — | [LeetCode drills](problems/leetcode) | TypeScript | BFS and DFS on binary trees |

Start with the problem's `README.md`. Some problems come in parts that build on
each other, and the README says when a later part replaces an earlier part's
tests.

## TCP problems (007–009)

These are tested over real sockets. You write `server.ts` exporting a
`createServer()` factory, and the tests connect to it through the provided
`harness.ts`. To try your server by hand:

```sh
node problems/007_tcp_chat_server/server.ts 5050
nc localhost 5050
```

Use port 5050, not 5000. On macOS, AirPlay Receiver holds port 5000 and accepts
connections without ever replying, which looks exactly like a broken server.

## Linting

```sh
npm run lint        # Biome
npm run typecheck   # tsc
```
