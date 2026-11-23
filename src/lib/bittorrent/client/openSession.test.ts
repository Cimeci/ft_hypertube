// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/client/openSession.test.ts
//
// On teste openSession contre un faux peer TCP local. Par défaut, le faux peer :
//   - répond à notre handshake par un handshake avec le bon infoHash
//   - envoie juste derrière un bitfield qui dit "j'ai les 2 pièces de hello"
// Chaque test peut remplacer ce qui est envoyé après le handshake (afterHandshake).
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, type AddressInfo, type Server, type Socket } from "node:net";
import { buildHandshake } from "../peer/handshake.ts";
import { hasPiece } from "../pieces/bitfield.ts";
import { parseTorrent } from "../torrent/parser.ts";
import type { Torrent } from "../torrent/types.ts";
import { openSession } from "./openSession.ts";

const hex = (value: string): Buffer => Buffer.from(value.replaceAll(" ", ""), "hex");

// hello.torrent : 2 pièces → un bitfield de 1 octet
const HELLO: Torrent = parseTorrent(readFileSync(new URL("../__fixtures__/hello.torrent", import.meta.url)));
const OUR_PEER_ID: Buffer = Buffer.from("-HT0001-123456789012");
const THEIR_PEER_ID: Buffer = Buffer.from("-qB4650-abcdefghijkl");

// --- Les messages que le faux peer envoie ---------------------------------------

const BITFIELD_BOTH = hex("00000002 05 c0"); // 1100 0000 → pièces 0 et 1
const BITFIELD_FIRST = hex("00000002 05 80"); // 1000 0000 → pièce 0 seulement
const BITFIELD_TOO_LONG = hex("00000004 05 ffffff"); // 3 octets au lieu de 1
const UNCHOKE = hex("00000001 01");
const HAVE_1 = hex("00000005 04 00000001");

// --- Le faux peer ----------------------------------------------------------------

let server: Server;
let port = 0;
let handshakeInfoHash: Buffer;
let afterHandshake: (peerSocket: Socket) => void;
let receivedByPeer: Buffer;
let openSockets: Socket[] = [];

before(async () => {
  server = createServer((peerSocket) => {
    openSockets.push(peerSocket);
    receivedByPeer = Buffer.alloc(0);
    let answered = false;
    peerSocket.on("error", () => {});
    peerSocket.on("data", (chunk) => {
      receivedByPeer = Buffer.concat([receivedByPeer, chunk]);
      if (answered || receivedByPeer.length < 68) return;
      answered = true;
      peerSocket.write(buildHandshake({ infoHash: handshakeInfoHash, peerId: THEIR_PEER_ID }));
      afterHandshake(peerSocket);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

after(() => {
  server.close();
});

beforeEach(() => {
  handshakeInfoHash = HELLO.infoHash;
  afterHandshake = (peerSocket) => peerSocket.write(BITFIELD_BOTH);
});

afterEach(() => {
  openSockets.forEach((socket) => socket.destroy());
  openSockets = [];
});

const PEER = () => ({ ip: "127.0.0.1", port });

// Dans les tests on n'attend jamais les 5 s par défaut
const WAIT_MS = 300;
const LIMIT = { timeout: 3000 };

// =================================================================================

describe("openSession / session prête", () => {
  it("envoie notre handshake avec l'infoHash du torrent et notre peerId", LIMIT, async () => {
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(receivedByPeer.subarray(0, 68), buildHandshake({ infoHash: HELLO.infoHash, peerId: OUR_PEER_ID }));
  });

  it("bitfield collé au handshake : la session connaît les pièces du peer", LIMIT, async () => {
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.equal(hasPiece(session.bitfield, 0), true);
    assert.equal(hasPiece(session.bitfield, 1), true);
  });

  it("une session neuve : choked, pending vide, peer renseigné", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(BITFIELD_FIRST);
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.equal(session.choked, true);
    assert.equal(session.pending.length, 0);
    assert.deepEqual(session.peer, PEER());
    assert.equal(hasPiece(session.bitfield, 1), false);
  });

  it("bitfield qui arrive plus tard (100 ms après le handshake) : attend", LIMIT, async () => {
    afterHandshake = (peerSocket) => setTimeout(() => peerSocket.write(BITFIELD_FIRST), 100);
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.equal(hasPiece(session.bitfield, 0), true);
  });

  it("have au lieu d'un bitfield : suffit aussi", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(HAVE_1);
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.equal(hasPiece(session.bitfield, 1), true);
    assert.equal(hasPiece(session.bitfield, 0), false);
  });

  it("bitfield + unchoke dans le même paquet : les deux sont appliqués", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(Buffer.concat([BITFIELD_BOTH, UNCHOKE]));
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.equal(session.choked, false);
  });

  it("message coupé derrière le bitfield : gardé dans session.pending", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(Buffer.concat([BITFIELD_BOTH, UNCHOKE.subarray(0, 3)]));
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(session.pending, UNCHOKE.subarray(0, 3));
  });

  it("laisse la connexion ouverte et retire ses écouteurs", LIMIT, async () => {
    const session = await openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS);
    assert.equal(session.socket.destroyed, false);
    assert.equal(session.socket.listenerCount("data"), 0);
    assert.equal(session.socket.listenerCount("error"), 0);
    assert.equal(session.socket.listenerCount("close"), 0);
    assert.equal(session.socket.listenerCount("timeout"), 0);
    session.socket.destroy();
  });
});

describe("openSession / les échecs (toujours avec l'adresse du peer)", () => {
  it("mauvais infoHash dans la réponse : rejette (vient de connectToPeer)", LIMIT, async () => {
    handshakeInfoHash = Buffer.alloc(20, 7);
    await assert.rejects(openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS), /peer 127\.0\.0\.1:\d+: info hash mismatch/);
  });

  it("aucun bitfield ni have avant timeoutMs : rejette et ferme", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(UNCHOKE);
    const started: number = Date.now();
    await assert.rejects(openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS), /peer 127\.0\.0\.1:\d+: no bitfield received/);
    assert.ok(Date.now() - started < 2000);
  });

  it("bitfield de la mauvaise taille : rejette sans planter", LIMIT, async () => {
    afterHandshake = (peerSocket) => peerSocket.write(BITFIELD_TOO_LONG);
    await assert.rejects(openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS), /peer 127\.0\.0\.1:\d+: bitfield has wrong length/);
  });

  it("le peer ferme juste après le handshake : rejette", LIMIT, async () => {
    afterHandshake = (peerSocket) => setTimeout(() => peerSocket.end(), 20);
    await assert.rejects(
      openSession(PEER(), HELLO, OUR_PEER_ID, WAIT_MS),
      /peer 127\.0\.0\.1:\d+: connection closed before bitfield/,
    );
  });
});
