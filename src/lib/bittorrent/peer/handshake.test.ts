// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildHandshake, parseHandshake } from "./handshake.ts";

const INFO_HASH = Buffer.from("8337c196d4536e9af5d2c7e599f0f1b7d71eee54", "hex"); // Big Buck Bunny
const PEER_ID = Buffer.from("-HT0001-123456789012");

// Vraie réponse d'un peer qBittorrent (2026-10-12) : 68 octets de handshake
// suivis, dans le même paquet TCP, de 111 octets du message suivant (bitfield)
const realReply = () => readFileSync(new URL("../__fixtures__/peer-handshake-reply.bin", import.meta.url));

describe("handshake / buildHandshake", () => {
  it("produit les 68 octets envoyés au vrai peer, dans l'ordre de la spec", () => {
    const expected = Buffer.concat([
      Buffer.from([19]),
      Buffer.from("BitTorrent protocol"),
      Buffer.alloc(8),
      INFO_HASH,
      PEER_ID,
    ]);
    const handshake = buildHandshake({ infoHash: INFO_HASH, peerId: PEER_ID });
    assert.equal(handshake.length, 68);
    assert.deepEqual(handshake, expected);
  });

  it("commence par l'octet 19, pas par le texte \"19\"", () => {
    const handshake = buildHandshake({ infoHash: INFO_HASH, peerId: PEER_ID });
    assert.equal(handshake[0], 0x13);
    assert.equal(handshake[1], 0x42); // 'B'
  });

  it("garde intacts les octets de l'infoHash qui ne sont pas du texte (0x83, 0xc1...)", () => {
    const handshake = buildHandshake({ infoHash: INFO_HASH, peerId: PEER_ID });
    assert.equal(handshake.subarray(28, 48).toString("hex"), "8337c196d4536e9af5d2c7e599f0f1b7d71eee54");
  });
});

describe("handshake / parseHandshake", () => {
  it("lit la vraie réponse de qBittorrent", () => {
    const { infoHash, peerId } = parseHandshake(realReply());
    assert.equal(infoHash.toString("hex"), "8337c196d4536e9af5d2c7e599f0f1b7d71eee54");
    assert.equal(peerId.toString(), "-qB5240-YKp)0XwajPzt");
  });

  it("ignore les octets du message suivant collés derrière (179 octets reçus)", () => {
    const reply = realReply();
    assert.equal(reply.length, 179);
    const { infoHash, peerId } = parseHandshake(reply);
    assert.equal(infoHash.length, 20);
    assert.equal(peerId.length, 20);
  });

  it("ignore les octets réservés envoyés par le peer (00 00 00 00 00 18 00 05)", () => {
    const reply = realReply();
    assert.equal(reply.subarray(20, 28).toString("hex"), "0000000000180005");
    assert.doesNotThrow(() => parseHandshake(reply));
  });

  it("relit exactement ce que buildHandshake a produit (aller-retour)", () => {
    const parsed = parseHandshake(buildHandshake({ infoHash: INFO_HASH, peerId: PEER_ID }));
    assert.deepEqual(parsed, { infoHash: INFO_HASH, peerId: PEER_ID });
  });
});

describe("handshake / les erreurs", () => {
  it("rejette un handshake incomplet (67 octets)", () => {
    assert.throws(() => parseHandshake(realReply().subarray(0, 67)), /peer: handshake too short/);
  });

  it("rejette un premier octet qui n'est pas 19", () => {
    const reply = Buffer.from(realReply());
    reply[0] = 18;
    assert.throws(() => parseHandshake(reply), /peer: not a BitTorrent handshake/);
  });

  it("rejette un autre protocole, même avec la bonne longueur", () => {
    const reply = Buffer.from(realReply());
    reply.write("BitTorrent protocoL", 1);
    assert.throws(() => parseHandshake(reply), /peer: not a BitTorrent handshake/);
  });

  it("rejette une réponse HTTP (un serveur web à la place d'un peer)", () => {
    const http = Buffer.from("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    assert.ok(http.length >= 68);
    assert.throws(() => parseHandshake(http), /peer: not a BitTorrent handshake/);
  });
});
