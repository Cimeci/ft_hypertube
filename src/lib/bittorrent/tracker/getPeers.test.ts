// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/tracker/getPeers.test.ts
//
// On teste getPeers contre deux faux trackers HTTP locaux (A et B),
// dont chaque test choisit la réponse (peers, erreur HTTP, lenteur).
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { parseTorrent } from "../torrent/parser.ts";
import type { Torrent } from "../torrent/types.ts";
import { getPeers } from "./getPeers.ts";

// hello.torrent : 18 octets au total
const HELLO: Torrent = parseTorrent(readFileSync(new URL("../__fixtures__/hello.torrent", import.meta.url)));
const PEER_ID: Buffer = Buffer.from("-HT0001-123456789012");
const PORT = 6881;

// --- Les réponses possibles d'un tracker ------------------------------------------

// Une réponse valide avec des peers au format compact : 4 octets d'IP + 2 octets de port
const withPeers = (...peers: string[]): Buffer => {
  const compact = Buffer.concat(
    peers.map((peer) => {
      const [ip, port] = peer.split(":");
      const bytes = Buffer.alloc(6);
      ip.split(".").forEach((part, i) => (bytes[i] = Number(part)));
      bytes.writeUInt16BE(Number(port), 4);
      return bytes;
    }),
  );
  return Buffer.concat([Buffer.from(`d8:intervali60e5:peers${compact.length}:`), compact, Buffer.from("e")]);
};

interface FakeTracker {
  url: string;
  status: number;
  body: Buffer;
  delayMs: number;
  requestUrl: string;
  server?: Server;
}

const trackerA: FakeTracker = { url: "", status: 200, body: withPeers(), delayMs: 0, requestUrl: "" };
const trackerB: FakeTracker = { url: "", status: 200, body: withPeers(), delayMs: 0, requestUrl: "" };

const startTracker = async (tracker: FakeTracker): Promise<void> => {
  tracker.server = createServer((req, res) => {
    tracker.requestUrl = req.url ?? "";
    setTimeout(() => {
      res.statusCode = tracker.status;
      res.end(tracker.body);
    }, tracker.delayMs);
  });
  await new Promise<void>((resolve) => tracker.server!.listen(0, "127.0.0.1", resolve));
  tracker.url = `http://127.0.0.1:${(tracker.server.address() as AddressInfo).port}/announce`;
};

before(async () => {
  await startTracker(trackerA);
  await startTracker(trackerB);
});

after(() => {
  trackerA.server?.close();
  trackerB.server?.close();
});

beforeEach(() => {
  for (const tracker of [trackerA, trackerB]) {
    tracker.status = 200;
    tracker.body = withPeers();
    tracker.delayMs = 0;
    tracker.requestUrl = "";
  }
});

// Le même torrent hello, mais avec les trackers de notre choix
const helloWith = (...trackers: string[]): Torrent => ({ ...HELLO, trackers });

const LIMIT = { timeout: 3000 };

// =================================================================================

describe("getPeers / réponses réussies", () => {
  it("un tracker : renvoie ses peers", LIMIT, async () => {
    trackerA.body = withPeers("10.0.0.1:6881", "10.0.0.2:51413");
    const peers = await getPeers(helloWith(trackerA.url), PEER_ID, PORT);
    assert.deepEqual(peers, [
      { ip: "10.0.0.1", port: 6881 },
      { ip: "10.0.0.2", port: 51413 },
    ]);
  });

  it("deux trackers : réunit leurs peers", LIMIT, async () => {
    trackerA.body = withPeers("10.0.0.1:6881");
    trackerB.body = withPeers("10.0.0.2:6881");
    const peers = await getPeers(helloWith(trackerA.url, trackerB.url), PEER_ID, PORT);
    assert.equal(peers.length, 2);
    assert.ok(peers.some((peer) => peer.ip === "10.0.0.1"));
    assert.ok(peers.some((peer) => peer.ip === "10.0.0.2"));
  });

  it("le même peer donné par les deux trackers : n'apparaît qu'une fois", LIMIT, async () => {
    trackerA.body = withPeers("10.0.0.1:6881", "10.0.0.2:6881");
    trackerB.body = withPeers("10.0.0.2:6881", "10.0.0.3:6881");
    const peers = await getPeers(helloWith(trackerA.url, trackerB.url), PEER_ID, PORT);
    assert.equal(peers.length, 3);
  });

  it("même IP mais port différent : ce sont deux peers différents", LIMIT, async () => {
    trackerA.body = withPeers("10.0.0.1:6881", "10.0.0.1:6882");
    const peers = await getPeers(helloWith(trackerA.url), PEER_ID, PORT);
    assert.equal(peers.length, 2);
  });

  it("un tracker qui répond sans aucun peer : liste vide, pas une erreur", LIMIT, async () => {
    const peers = await getPeers(helloWith(trackerA.url), PEER_ID, PORT);
    assert.deepEqual(peers, []);
  });

  it("envoie l'infoHash du torrent, notre peerId, notre port et left = taille totale", LIMIT, async () => {
    await getPeers(helloWith(trackerA.url), PEER_ID, PORT);
    // l'infoHash est du binaire : on le compare encodé, tel qu'il est écrit dans l'URL
    const encodedInfoHash: string = [...HELLO.infoHash].map((byte) => `%${byte.toString(16).padStart(2, "0")}`).join("");
    assert.ok(trackerA.requestUrl.includes(`info_hash=${encodedInfoHash}`));
    const query = new URL(trackerA.requestUrl, "http://localhost").searchParams;
    assert.equal(query.get("port"), "6881");
    assert.equal(query.get("left"), String(HELLO.totalLength));
    assert.equal(query.get("downloaded"), "0");
    assert.ok(trackerA.requestUrl.includes("peer_id=%2d%48%54"));
  });

  it("interroge les trackers en même temps, pas l'un après l'autre", LIMIT, async () => {
    trackerA.delayMs = 400;
    trackerB.delayMs = 400;
    const started: number = Date.now();
    await getPeers(helloWith(trackerA.url, trackerB.url), PEER_ID, PORT);
    assert.ok(Date.now() - started < 700, "les deux réponses de 400 ms devraient se chevaucher");
  });
});

describe("getPeers / trackers en panne", () => {
  it("un tracker en erreur HTTP 500, l'autre répond : renvoie les peers de celui qui répond", LIMIT, async () => {
    trackerA.status = 500;
    trackerB.body = withPeers("10.0.0.9:6881");
    const peers = await getPeers(helloWith(trackerA.url, trackerB.url), PEER_ID, PORT);
    assert.deepEqual(peers, [{ ip: "10.0.0.9", port: 6881 }]);
  });

  it("un tracker udp:// (pas encore géré) dans la liste : ignoré", LIMIT, async () => {
    trackerA.body = withPeers("10.0.0.1:6881");
    const peers = await getPeers(helloWith("udp://tracker.example.org:1337/announce", trackerA.url), PEER_ID, PORT);
    assert.deepEqual(peers, [{ ip: "10.0.0.1", port: 6881 }]);
  });

  it("tous les trackers en panne : rejette", LIMIT, async () => {
    trackerA.status = 500;
    trackerB.body = Buffer.from("pas du bencode");
    await assert.rejects(
      getPeers(helloWith(trackerA.url, trackerB.url), PEER_ID, PORT),
      /no tracker answered \(2 tried\)/,
    );
  });

  it("aucun tracker dans le torrent : rejette", LIMIT, async () => {
    await assert.rejects(getPeers(helloWith(), PEER_ID, PORT), /no tracker answered \(0 tried\)/);
  });
});
