// Un faux peer BitTorrent pour les tests : un vrai serveur TCP local qui parle le protocole.
//
// Comportements possibles (behavior) :
//   "good"             : répond au handshake, envoie son bitfield, unchoke, sert les vrais blocs
//   "corrupt"          : comme good, mais chaque bloc envoyé est faux (le SHA-1 échouera)
//   "close-on-request" : ferme la connexion dès qu'on lui demande un bloc
//   "silent"           : handshake + bitfield, puis ne répond plus jamais (ni unchoke ni blocs)
import { createServer, type AddressInfo, type Server, type Socket } from "node:net";
import { buildHandshake } from "../peer/handshake.ts";
import { splitMessages } from "../peer/messages.ts";
import { setPiece } from "../pieces/bitfield.ts";
import type { Torrent } from "../torrent/types.ts";
import type { Peer } from "../tracker/types.ts";

export type FakePeerBehavior = "good" | "corrupt" | "close-on-request" | "silent";

export interface FakePeerOptions {
  torrent: Torrent;
  data: Buffer;
  has: number[];
  behavior?: FakePeerBehavior;
}

export interface FakePeer {
  peer: Peer;
  connections: number;
  requestedPieces: number[];
  stop: () => Promise<void>;
}

const HANDSHAKE_LENGTH = 68;
const UNCHOKE = Buffer.from("0000000101", "hex");
const ID_INTERESTED = 2;
const ID_REQUEST = 6;
const THEIR_PEER_ID = Buffer.from("-FK0001-fakepeer0000");

const bitfieldMessage = (torrent: Torrent, has: number[]): Buffer => {
  const bitfield = Buffer.alloc(Math.ceil(torrent.pieces.length / 8));
  has.forEach((index) => setPiece(bitfield, index));
  const header = Buffer.alloc(5);
  header.writeUInt32BE(1 + bitfield.length, 0);
  header[4] = 5;
  return Buffer.concat([header, bitfield]);
};

const pieceMessage = (index: number, begin: number, block: Buffer): Buffer => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(9 + block.length, 0);
  header[4] = 7;
  header.writeUInt32BE(index, 5);
  header.writeUInt32BE(begin, 9);
  return Buffer.concat([header, block]);
};

export async function startFakePeer(options: FakePeerOptions): Promise<FakePeer> {
  const { torrent, data, has, behavior = "good" } = options;
  const sockets: Socket[] = [];
  const fake: FakePeer = { peer: { ip: "127.0.0.1", port: 0 }, connections: 0, requestedPieces: [], stop: async () => {} };

  const answerRequest = (socket: Socket, message: Buffer): void => {
    const index = message.readUInt32BE(1);
    const begin = message.readUInt32BE(5);
    const length = message.readUInt32BE(9);
    if (begin === 0) fake.requestedPieces.push(index);
    if (behavior === "close-on-request") return void socket.destroy();
    const start = index * torrent.pieceLength + begin;
    const block = Buffer.from(data.subarray(start, start + length));
    if (behavior === "corrupt") block[0] ^= 0xff;
    socket.write(pieceMessage(index, begin, block));
  };

  const server: Server = createServer((socket) => {
    fake.connections++;
    sockets.push(socket);
    socket.on("error", () => {});
    let received: Buffer = Buffer.alloc(0);
    let handshakeDone = false;
    socket.on("data", (chunk: Buffer) => {
      received = Buffer.concat([received, chunk]);
      if (!handshakeDone) {
        if (received.length < HANDSHAKE_LENGTH) return;
        handshakeDone = true;
        received = received.subarray(HANDSHAKE_LENGTH);
        socket.write(buildHandshake({ infoHash: torrent.infoHash, peerId: THEIR_PEER_ID }));
        if (has.length > 0) socket.write(bitfieldMessage(torrent, has));
      }
      const { messages, rest } = splitMessages(received);
      received = rest;
      for (const message of messages) {
        if (behavior === "silent") continue;
        if (message[0] === ID_INTERESTED) socket.write(UNCHOKE);
        if (message[0] === ID_REQUEST) answerRequest(socket, message);
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  fake.peer = { ip: "127.0.0.1", port: (server.address() as AddressInfo).port };
  fake.stop = async () => {
    sockets.forEach((socket) => socket.destroy());
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  return fake;
}

// Une adresse où personne n'écoute : la connexion sera refusée tout de suite
export async function deadPeer(): Promise<Peer> {
  const server: Server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return { ip: "127.0.0.1", port };
}
