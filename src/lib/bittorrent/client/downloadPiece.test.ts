// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/client/downloadPiece.test.ts
//
// On teste downloadPiece contre un faux peer TCP local. Par défaut, le faux peer :
//   - envoie unchoke dès qu'on se connecte
//   - répond à chaque request avec le vrai bloc demandé
// Chaque test peut remplacer ces deux comportements (onConnect / onRequest).
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { connect, createServer, type AddressInfo, type Server, type Socket } from "node:net";
import { splitMessages } from "../peer/messages.ts";
import { parseTorrent } from "../torrent/parser.ts";
import type { Torrent } from "../torrent/types.ts";
import { hasPiece } from "../pieces/bitfield.ts";
import { downloadPiece } from "./downloadPiece.ts";
import type { PeerSession } from "./types.ts";

const hex = (value: string) => Buffer.from(value.replaceAll(" ", ""), "hex");
const sha1 = (data: Buffer) => createHash("sha1").update(data).digest();

// --- Les deux torrents servis par le faux peer ---------------------------------

// hello.torrent : "Hello BitTorrent!\n", pièces de 16 → pièce 0 = 16 octets, pièce 1 = 2 octets
const HELLO = parseTorrent(readFileSync(new URL("../__fixtures__/hello.torrent", import.meta.url)));
const HELLO_DATA = readFileSync(new URL("../__fixtures__/hello.txt", import.meta.url));

// Un torrent fabriqué avec des pièces de plusieurs blocs : 40 000 octets, pièces de 32 768
//   pièce 0 = 32 768 octets = 2 blocs (begin 0 et 16384)
//   pièce 1 =  7 232 octets = 1 bloc plus petit
const BIG_DATA: Buffer = Buffer.from(Buffer.alloc(40000).map((_, i) => i % 251));
const BIG: Torrent = {
  trackers: [],
  name: "big.bin",
  pieceLength: 32768,
  pieces: [sha1(BIG_DATA.subarray(0, 32768)), sha1(BIG_DATA.subarray(32768))],
  files: [{ path: "big.bin", length: 40000, offset: 0 }],
  totalLength: 40000,
  infoHash: Buffer.alloc(20),
};

// --- Les messages que le faux peer envoie ---------------------------------------

const CHOKE = hex("00000001 00");
const UNCHOKE = hex("00000001 01");
const KEEP_ALIVE = hex("00000000");
const have = (index: number) => {
  const message = hex("00000005 04 00000000");
  message.writeUInt32BE(index, 5);
  return message;
};
const pieceMessage = (index: number, begin: number, block: Buffer) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(9 + block.length, 0);
  header[4] = 7;
  header.writeUInt32BE(index, 5);
  header.writeUInt32BE(begin, 9);
  return Buffer.concat([header, block]);
};

// --- Le faux peer ----------------------------------------------------------------

interface Request {
  index: number;
  begin: number;
  length: number;
}

let server: Server;
let port = 0;
let servedTorrent: Torrent;
let servedData: Buffer;
let onConnect: (peerSocket: Socket) => void;
let onRequest: (peerSocket: Socket, request: Request) => void;
let requests: Request[];
let peerSawClose: Promise<void>;
// Toutes les connexions ouvertes pendant un test, fermées après lui quoi qu'il arrive
let openSockets: Socket[] = [];

// Le vrai bloc demandé, pris dans les données du torrent servi
const realBlock = ({ index, begin, length }: Request) => {
  const start = index * servedTorrent.pieceLength + begin;
  return servedData.subarray(start, start + length);
};
const answer = (peerSocket: Socket, request: Request) =>
  peerSocket.write(pieceMessage(request.index, request.begin, realBlock(request)));

before(async () => {
  server = createServer((peerSocket) => {
    openSockets.push(peerSocket);
    requests = [];
    let received: Buffer = Buffer.alloc(0);
    peerSocket.on("error", () => {});
    peerSawClose = new Promise((resolve) => peerSocket.on("close", () => resolve()));
    peerSocket.on("data", (chunk) => {
      const { messages, rest } = splitMessages(Buffer.concat([received, chunk]));
      received = rest;
      for (const message of messages) {
        if (message[0] !== 6) continue;
        const request = {
          index: message.readUInt32BE(1),
          begin: message.readUInt32BE(5),
          length: message.readUInt32BE(9),
        };
        requests.push(request);
        onRequest(peerSocket, request);
      }
    });
    onConnect(peerSocket);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

after(() => {
  server.close();
});

beforeEach(() => {
  serve(HELLO, HELLO_DATA);
  onConnect = (peerSocket) => peerSocket.write(UNCHOKE);
  onRequest = answer;
});

// Si downloadPiece ne se termine jamais, ses connexions resteraient ouvertes
// et empêcheraient le fichier de test de s'arrêter
afterEach(() => {
  openSockets.forEach((socket) => socket.destroy());
  openSockets = [];
});

const serve = (torrent: Torrent, data: Buffer) => {
  servedTorrent = torrent;
  servedData = data;
};

// Une session neuve vers le faux peer, comme openSession la créera (sans handshake ici)
const openTestSession = async (torrent: Torrent, overrides: Partial<PeerSession> = {}) => {
  const socket = connect(port, "127.0.0.1");
  openSockets.push(socket);
  await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
  const session: PeerSession = {
    socket,
    pending: Buffer.alloc(0),
    bitfield: Buffer.alloc(Math.ceil(torrent.pieces.length / 8)),
    choked: true,
    peer: { ip: "127.0.0.1", port },
    ...overrides,
  };
  return session;
};

// Dans les tests, on n'attend jamais les 30 s par défaut : un bloc qui n'arrive pas
// fait échouer downloadPiece au bout d'1 s, et le test au bout de 3 s au pire
const WAIT_MS = 1000;
const LIMIT = { timeout: 3000 };

// =================================================================================

describe("downloadPiece / téléchargement réussi", () => {
  it("hello, pièce 0 : renvoie les 16 octets \"Hello BitTorrent\"", LIMIT, async () => {
    const session = await openTestSession(HELLO);
    const data = await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("Hello BitTorrent"));
  });

  it("hello, pièce 1 (la dernière, 2 octets) : renvoie \"!\\n\"", LIMIT, async () => {
    const session = await openTestSession(HELLO);
    const data = await downloadPiece(session, HELLO, 1, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("!\n"));
  });

  it("envoie exactement les requêtes de pieceBlocks (1 bloc de 16 octets pour hello 0)", LIMIT, async () => {
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(requests, [{ index: 0, begin: 0, length: 16 }]);
  });

  it("pièce de 2 blocs : demande begin 0 et 16384, puis recolle dans l'ordre", LIMIT, async () => {
    serve(BIG, BIG_DATA);
    const session = await openTestSession(BIG);
    const data = await downloadPiece(session, BIG, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(requests, [
      { index: 0, begin: 0, length: 16384 },
      { index: 0, begin: 16384, length: 16384 },
    ]);
    assert.deepEqual(data, BIG_DATA.subarray(0, 32768));
  });

  it("blocs reçus dans le désordre : recolle quand même dans l'ordre des begin", LIMIT, async () => {
    serve(BIG, BIG_DATA);
    const waiting: Request[] = [];
    onRequest = (peerSocket, request) => {
      waiting.push(request);
      if (waiting.length === 2) waiting.reverse().forEach((r) => answer(peerSocket, r));
    };
    const session = await openTestSession(BIG);
    const data = await downloadPiece(session, BIG, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, BIG_DATA.subarray(0, 32768));
  });

  it("dernière pièce plus petite (7 232 octets) : un seul bloc de la bonne taille", LIMIT, async () => {
    serve(BIG, BIG_DATA);
    const session = await openTestSession(BIG);
    const data = await downloadPiece(session, BIG, 1, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(requests, [{ index: 1, begin: 0, length: 7232 }]);
    assert.deepEqual(data, BIG_DATA.subarray(32768));
  });

  it("bloc coupé en 3 morceaux TCP : accumule avant de lire", LIMIT, async () => {
    onRequest = (peerSocket, request) => {
      const message = pieceMessage(request.index, request.begin, realBlock(request));
      [message.subarray(0, 3), message.subarray(3, 15), message.subarray(15)].forEach((part, i) =>
        setTimeout(() => peerSocket.write(part), i * 20),
      );
    };
    const session = await openTestSession(HELLO);
    const data = await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("Hello BitTorrent"));
  });

  it("ignore un keep-alive et un bloc d'une autre pièce reçus au milieu", LIMIT, async () => {
    onRequest = (peerSocket, request) => {
      peerSocket.write(KEEP_ALIVE);
      peerSocket.write(pieceMessage(1, 0, Buffer.from("!\n")));
      answer(peerSocket, request);
    };
    const session = await openTestSession(HELLO);
    const data = await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("Hello BitTorrent"));
  });
});

describe("downloadPiece / choke et unchoke", () => {
  it("n'envoie aucune requête avant l'unchoke", LIMIT, async () => {
    let requestsBeforeUnchoke = -1;
    onConnect = (peerSocket) =>
      setTimeout(() => {
        requestsBeforeUnchoke = requests.length;
        peerSocket.write(UNCHOKE);
      }, 100);
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.equal(requestsBeforeUnchoke, 0);
  });

  it("deux unchoke à la suite (comme le vrai peer) : ne demande les blocs qu'une fois", LIMIT, async () => {
    onConnect = (peerSocket) => peerSocket.write(Buffer.concat([UNCHOKE, UNCHOKE]));
    onRequest = (peerSocket, request) => setTimeout(() => answer(peerSocket, request), 50);
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.equal(requests.length, 1);
  });

  it("session déjà unchoke (choked: false) : demande tout de suite, sans attendre", LIMIT, async () => {
    onConnect = () => {}; // le peer n'enverra plus jamais unchoke
    const session = await openTestSession(HELLO, { choked: false });
    const data = await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("Hello BitTorrent"));
  });

  it("unchoke déjà présent dans session.pending (reste du handshake) : il est lu en premier", LIMIT, async () => {
    onConnect = () => {};
    const session = await openTestSession(HELLO, { pending: UNCHOKE });
    const data = await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(data, Buffer.from("Hello BitTorrent"));
    assert.equal(session.choked, false);
  });
});

describe("downloadPiece / la session après une pièce réussie", () => {
  it("deux pièces à la suite sur la même session", LIMIT, async () => {
    const session = await openTestSession(HELLO);
    const first = await downloadPiece(session, HELLO, 0, WAIT_MS);
    const second = await downloadPiece(session, HELLO, 1, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(Buffer.concat([first, second]), HELLO_DATA);
  });

  it("laisse la connexion ouverte et retire ses écouteurs", LIMIT, async () => {
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    assert.equal(session.socket.destroyed, false);
    assert.equal(session.socket.listenerCount("data"), 0);
    assert.equal(session.socket.listenerCount("error"), 0);
    assert.equal(session.socket.listenerCount("close"), 0);
    assert.equal(session.socket.listenerCount("timeout"), 0);
    session.socket.destroy();
  });

  it("un have collé derrière le dernier bloc est appliqué à la session", LIMIT, async () => {
    onRequest = (peerSocket, request) =>
      peerSocket.write(Buffer.concat([pieceMessage(0, 0, realBlock(request)), have(1)]));
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.equal(hasPiece(session.bitfield, 1), true);
  });

  it("un message coupé derrière le dernier bloc est gardé dans session.pending", LIMIT, async () => {
    onRequest = (peerSocket, request) =>
      peerSocket.write(Buffer.concat([pieceMessage(0, 0, realBlock(request)), have(1).subarray(0, 6)]));
    const session = await openTestSession(HELLO);
    await downloadPiece(session, HELLO, 0, WAIT_MS);
    session.socket.destroy();
    assert.deepEqual(session.pending, have(1).subarray(0, 6));
  });
});

describe("downloadPiece / les échecs (toujours avec l'adresse du peer)", () => {
  it("bloc corrompu : rejette la pièce et ferme la connexion", LIMIT, async () => {
    onRequest = (peerSocket, request) =>
      peerSocket.write(pieceMessage(0, 0, Buffer.from("Hello BitTorrenT")));
    const session = await openTestSession(HELLO);
    await assert.rejects(downloadPiece(session, HELLO, 0, WAIT_MS), /peer 127\.0\.0\.1:\d+: piece 0 failed hash check/);
    await peerSawClose;
    assert.equal(session.socket.destroyed, true);
  });

  it("choke pendant le téléchargement : rejette (les requêtes sont annulées)", LIMIT, async () => {
    onRequest = (peerSocket) => peerSocket.write(CHOKE);
    const session = await openTestSession(HELLO);
    await assert.rejects(downloadPiece(session, HELLO, 0, WAIT_MS), /peer 127\.0\.0\.1:\d+: choked during piece 0/);
  });

  it("le peer ferme au milieu : rejette", LIMIT, async () => {
    onRequest = (peerSocket) => peerSocket.end();
    const session = await openTestSession(HELLO);
    await assert.rejects(
      downloadPiece(session, HELLO, 0, WAIT_MS),
      /peer 127\.0\.0\.1:\d+: connection closed during piece 0/,
    );
  });

  it("le peer coupe brutalement (ECONNRESET) : l'erreur contient son adresse", LIMIT, async () => {
    onRequest = (peerSocket) => peerSocket.resetAndDestroy();
    const session = await openTestSession(HELLO);
    await assert.rejects(downloadPiece(session, HELLO, 0, WAIT_MS), /peer 127\.0\.0\.1:\d+: .*ECONNRESET/);
  });

  it("le peer ne répond plus : rejette après timeoutMs (ici 100 ms)", LIMIT, async () => {
    onRequest = () => {};
    const session = await openTestSession(HELLO);
    const started = Date.now();
    await assert.rejects(downloadPiece(session, HELLO, 0, 100), /peer 127\.0\.0\.1:\d+: timed out during piece 0/);
    assert.ok(Date.now() - started < 2000);
  });

  it("bitfield de la mauvaise taille reçu pendant le téléchargement : rejette sans planter", LIMIT, async () => {
    onConnect = (peerSocket) => peerSocket.write(hex("00000004 05 ffffff")); // 3 octets au lieu de 1
    const session = await openTestSession(HELLO);
    await assert.rejects(downloadPiece(session, HELLO, 0, WAIT_MS), /peer 127\.0\.0\.1:\d+: bitfield has wrong length/);
  });

  it("après un échec : écouteurs retirés et connexion fermée", LIMIT, async () => {
    onRequest = (peerSocket) => peerSocket.write(CHOKE);
    const session = await openTestSession(HELLO);
    await assert.rejects(downloadPiece(session, HELLO, 0, WAIT_MS));
    assert.equal(session.socket.destroyed, true);
    assert.equal(session.socket.listenerCount("data"), 0);
    assert.equal(session.socket.listenerCount("timeout"), 0);
  });
});
