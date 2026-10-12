// Lancer : npm run test:bt
// On teste connectToPeer contre un faux peer TCP local, dont on choisit le
// comportement (réponse en un ou plusieurs morceaux, mauvais infoHash, fermeture...)
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, type Server, type Socket } from "node:net";
import type { AddressInfo } from "node:net";
import { connectToPeer } from "./connection.ts";
import { buildHandshake } from "./handshake.ts";

// Vraie réponse de qBittorrent : 68 octets de handshake + 111 octets de bitfield
const REAL_REPLY = readFileSync(new URL("../__fixtures__/peer-handshake-reply.bin", import.meta.url));
const INFO_HASH = REAL_REPLY.subarray(28, 48); // Big Buck Bunny
const PEER_ID = Buffer.from("-HT0001-123456789012");
const OUR_HANDSHAKE = { infoHash: INFO_HASH, peerId: PEER_ID };

let server: Server;
let port = 0;
// Ce que fait le faux peer quand on se connecte à lui ; chaque test le remplace
let behavior: (peerSocket: Socket) => void;
let receivedByPeer: Buffer;
let peerSawClose: Promise<void>;

before(async () => {
  server = createServer((peerSocket) => {
    receivedByPeer = Buffer.alloc(0);
    peerSocket.on("data", (chunk) => (receivedByPeer = Buffer.concat([receivedByPeer, chunk])));
    peerSocket.on("error", () => {});
    peerSawClose = new Promise((resolve) => peerSocket.on("close", () => resolve()));
    behavior(peerSocket);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;
});

after(() => {
  server.close();
});

beforeEach(() => {
  behavior = (peerSocket) => peerSocket.write(REAL_REPLY);
});

const connectToFakePeer = () => connectToPeer({ ip: "127.0.0.1", port }, OUR_HANDSHAKE);

// Envoie les octets en plusieurs morceaux, avec une pause entre chacun pour que
// TCP ne les recolle pas : chaque morceau arrive dans un événement "data" séparé
const sendInChunks = (peerSocket: Socket, data: Buffer, cuts: number[]) => {
  const bounds = [0, ...cuts, data.length];
  bounds.slice(1).forEach((end, i) => {
    setTimeout(() => peerSocket.write(data.subarray(bounds[i], end)), i * 20);
  });
};

describe("connection / handshake réussi", () => {
  it("envoie notre handshake de 68 octets au peer", async () => {
    const { socket } = await connectToFakePeer();
    socket.destroy();
    assert.deepEqual(receivedByPeer.subarray(0, 68), buildHandshake(OUR_HANDSHAKE));
  });

  it("réponse en un seul morceau : garde les 111 octets du bitfield", async () => {
    const { socket, leftover } = await connectToFakePeer();
    socket.destroy();
    assert.deepEqual(leftover, REAL_REPLY.subarray(68));
    assert.equal(leftover.length, 111);
  });

  it("réponse en 2 morceaux (40 + 139) : accumule avant de lire", async () => {
    behavior = (peerSocket) => sendInChunks(peerSocket, REAL_REPLY, [40]);
    const { socket, leftover } = await connectToFakePeer();
    socket.destroy();
    assert.deepEqual(leftover, REAL_REPLY.subarray(68));
  });

  it("réponse en morceaux coupés n'importe où (1, 30, 67, reste) : s'arrête dès 68 octets", async () => {
    behavior = (peerSocket) => sendInChunks(peerSocket, REAL_REPLY, [1, 31, 98]);
    const { socket, leftover } = await connectToFakePeer();
    socket.destroy();
    // Au 3e morceau on a 98 octets : on résout avec les 30 en trop, sans attendre le 4e
    assert.deepEqual(leftover, REAL_REPLY.subarray(68, 98));
  });

  it("handshake seul, sans message derrière : leftover vide", async () => {
    behavior = (peerSocket) => peerSocket.write(REAL_REPLY.subarray(0, 68));
    const { socket, leftover } = await connectToFakePeer();
    socket.destroy();
    assert.equal(leftover.length, 0);
  });

  it("laisse la connexion ouverte et retire ses écouteurs", async () => {
    const { socket } = await connectToFakePeer();
    assert.equal(socket.destroyed, false);
    assert.equal(socket.listenerCount("data"), 0);
    assert.equal(socket.listenerCount("error"), 0);
    assert.equal(socket.listenerCount("close"), 0);
    assert.equal(socket.listenerCount("timeout"), 0);
    socket.destroy();
  });
});

describe("connection / les échecs", () => {
  it("rejette un peer qui n'a pas notre torrent, et ferme la connexion", async () => {
    const otherTorrent = Buffer.from(REAL_REPLY);
    otherTorrent.fill(0xaa, 28, 48);
    behavior = (peerSocket) => peerSocket.write(otherTorrent);
    await assert.rejects(connectToFakePeer(), /peer 127\.0\.0\.1:\d+: info hash mismatch/);
    await peerSawClose;
  });

  it("rejette un peer qui ne parle pas BitTorrent, et ferme la connexion", async () => {
    behavior = (peerSocket) =>
      peerSocket.write("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\nContent-Length: 0\r\n\r\n");
    await assert.rejects(connectToFakePeer(), /not a BitTorrent handshake/);
    await peerSawClose;
  });

  it("rejette un peer qui ferme après 30 octets", async () => {
    behavior = (peerSocket) => peerSocket.end(REAL_REPLY.subarray(0, 30));
    await assert.rejects(connectToFakePeer(), /peer 127\.0\.0\.1:\d+: connection closed before handshake/);
  });

  it("rejette un peer qui ferme sans rien envoyer", async () => {
    behavior = (peerSocket) => peerSocket.end();
    await assert.rejects(connectToFakePeer(), /connection closed before handshake/);
  });

  it("rejette un peer éteint (port fermé) sans faire planter le processus", async () => {
    const closed = createServer();
    await new Promise<void>((resolve) => closed.listen(0, "127.0.0.1", resolve));
    const closedPort = (closed.address() as AddressInfo).port;
    await new Promise<void>((resolve) => closed.close(() => resolve()));

    await assert.rejects(
      connectToPeer({ ip: "127.0.0.1", port: closedPort }, OUR_HANDSHAKE),
      /ECONNREFUSED/,
    );
  });
});
