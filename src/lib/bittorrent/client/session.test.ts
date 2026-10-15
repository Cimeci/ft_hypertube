// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/client/session.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Socket } from "node:net";
import { parseMessage, splitMessages } from "../peer/messages.ts";
import { hasPiece } from "../pieces/bitfield.ts";
import { applyMessage } from "./session.ts";
import type { PeerSession } from "./types.ts";

// Big Buck Bunny : 842 pièces → bitfield de 106 octets
const BITFIELD_LENGTH = 106;
// applyMessage ne touche pas au réseau : un faux socket suffit
const FAKE_SOCKET = {} as Socket;

// Une session toute neuve, comme openSession la créera : boîte vide, chokés
const newSession = (): PeerSession => ({
  socket: FAKE_SOCKET,
  pending: Buffer.alloc(0),
  bitfield: Buffer.alloc(BITFIELD_LENGTH),
  choked: true,
  peer: { ip: "103.108.231.238", port: 35240 },
});

// Les vrais messages reçus du peer : bitfield (106 octets), unchoke, unchoke
const REAL_MESSAGES = readFileSync(new URL("../__fixtures__/peer-messages.bin", import.meta.url));
const [REAL_BITFIELD, REAL_UNCHOKE] = splitMessages(REAL_MESSAGES).messages.map(parseMessage);

describe("session / applyMessage : choke et unchoke", () => {
  it("unchoke : on a le droit de demander des blocs", () => {
    const session = newSession();
    applyMessage(session, { type: "unchoke" });
    assert.equal(session.choked, false);
  });

  it("choke après unchoke : on n'a plus le droit", () => {
    const session = newSession();
    applyMessage(session, { type: "unchoke" });
    applyMessage(session, { type: "choke" });
    assert.equal(session.choked, true);
  });

  it("le vrai unchoke reçu du réseau débloque la session", () => {
    const session = newSession();
    applyMessage(session, REAL_UNCHOKE);
    assert.equal(session.choked, false);
  });
});

describe("session / applyMessage : bitfield et have", () => {
  it("le vrai bitfield remplace la boîte vide : le peer a les pièces 0 et 841", () => {
    const session = newSession();
    applyMessage(session, REAL_BITFIELD);
    assert.equal(hasPiece(session.bitfield, 0), true);
    assert.equal(hasPiece(session.bitfield, 841), true);
    assert.equal(session.bitfield[105], 0xc0);
  });

  it("have 12 pose la pièce 12 dans la boîte vide (peer sans bitfield)", () => {
    const session = newSession();
    applyMessage(session, { type: "have", index: 12 });
    assert.equal(hasPiece(session.bitfield, 12), true);
    assert.equal(hasPiece(session.bitfield, 11), false);
    assert.equal(session.bitfield[1], 0x08);
  });

  it("have après un bitfield : ajoute la pièce sans effacer les autres", () => {
    const session = newSession();
    const bitfield = Buffer.alloc(BITFIELD_LENGTH);
    bitfield[0] = 0x80; // seulement la pièce 0
    applyMessage(session, { type: "bitfield", bitfield });
    applyMessage(session, { type: "have", index: 3 });
    assert.equal(hasPiece(session.bitfield, 0), true);
    assert.equal(hasPiece(session.bitfield, 3), true);
    assert.equal(session.bitfield[0], 0x90);
  });

  it("have hors du torrent (900) : ignoré, sans planter", () => {
    const session = newSession();
    applyMessage(session, { type: "have", index: 900 });
    assert.deepEqual(session.bitfield, Buffer.alloc(BITFIELD_LENGTH));
  });
});

describe("session / applyMessage : les messages qui ne changent rien", () => {
  for (const message of [
    { type: "keep-alive" },
    { type: "interested" },
    { type: "not-interested" },
    { type: "piece", index: 0, begin: 0, block: Buffer.from("abc") },
    { type: "unknown", id: 20 },
  ] as const) {
    it(`${message.type} : la session reste identique`, () => {
      const session = newSession();
      applyMessage(session, message);
      assert.deepEqual(session, newSession());
    });
  }
});

describe("session / applyMessage : les erreurs", () => {
  it("rejette un bitfield trop court, avec l'adresse du peer", () => {
    const session = newSession();
    assert.throws(
      () => applyMessage(session, { type: "bitfield", bitfield: Buffer.alloc(105) }),
      /peer 103\.108\.231\.238:35240: bitfield has wrong length/,
    );
  });

  it("rejette un bitfield trop long", () => {
    const session = newSession();
    assert.throws(
      () => applyMessage(session, { type: "bitfield", bitfield: Buffer.alloc(107) }),
      /bitfield has wrong length/,
    );
  });

  it("un bitfield rejeté ne modifie pas la session", () => {
    const session = newSession();
    assert.throws(() => applyMessage(session, { type: "bitfield", bitfield: Buffer.alloc(105, 0xff) }));
    assert.deepEqual(session.bitfield, Buffer.alloc(BITFIELD_LENGTH));
  });
});
