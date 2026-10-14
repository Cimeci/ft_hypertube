// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildInterested, buildRequest, parseMessage, splitMessages } from "./messages.ts";

// Vrais octets reçus d'un peer de Big Buck Bunny (2026-10-13), juste après le handshake :
// bitfield (4 + 107 octets), puis unchoke (4 + 1), puis unchoke (4 + 1)
const REAL_MESSAGES = readFileSync(new URL("../__fixtures__/peer-messages.bin", import.meta.url));

const hex = (value: string) => Buffer.from(value.replaceAll(" ", ""), "hex");

describe("messages / splitMessages", () => {
  it("découpe les 121 vrais octets en 3 messages, sans les 4 octets de longueur", () => {
    const { messages, rest } = splitMessages(REAL_MESSAGES);
    assert.deepEqual(messages.map((message) => message.length), [107, 1, 1]);
    assert.deepEqual(messages.map((message) => message[0]), [5, 1, 1]);
    assert.equal(rest.length, 0);
  });

  it("garde un message coupé en deux pour plus tard (bitfield coupé à 50 octets)", () => {
    const { messages, rest } = splitMessages(REAL_MESSAGES.subarray(0, 50));
    assert.equal(messages.length, 0);
    assert.deepEqual(rest, REAL_MESSAGES.subarray(0, 50));
  });

  it("garde une longueur incomplète (2 octets sur 4)", () => {
    const { messages, rest } = splitMessages(REAL_MESSAGES.subarray(0, 113));
    assert.equal(messages.length, 1);
    assert.deepEqual(rest, hex("00 00"));
  });

  it("rend les messages complets et garde le reste du suivant", () => {
    const { messages, rest } = splitMessages(REAL_MESSAGES.subarray(0, 118));
    assert.equal(messages.length, 2);
    assert.deepEqual(rest, hex("00 00"));
  });

  it("donne un message vide pour un keep-alive (longueur 0)", () => {
    const { messages, rest } = splitMessages(hex("00000000 00000001 01"));
    assert.deepEqual(messages, [hex(""), hex("01")]);
    assert.equal(rest.length, 0);
  });

  it("ne rend rien pour un buffer vide", () => {
    assert.deepEqual(splitMessages(Buffer.alloc(0)), { messages: [], rest: Buffer.alloc(0) });
  });

  it("retrouve les mêmes messages quand le flux arrive par morceaux de 7 octets", () => {
    const found: Buffer[] = [];
    let pending: Buffer = Buffer.alloc(0);
    for (let start = 0; start < REAL_MESSAGES.length; start += 7) {
      pending = Buffer.concat([pending, REAL_MESSAGES.subarray(start, start + 7)]);
      const { messages, rest } = splitMessages(pending);
      found.push(...messages);
      pending = rest;
    }
    assert.deepEqual(found, splitMessages(REAL_MESSAGES).messages);
    assert.equal(pending.length, 0);
  });
});

describe("messages / parseMessage", () => {
  it("lit les 3 vrais messages : un bitfield de 842 pièces, puis deux unchoke", () => {
    const [bitfield, unchoke1, unchoke2] = splitMessages(REAL_MESSAGES).messages.map(parseMessage);
    assert.equal(bitfield.type, "bitfield");
    if (bitfield.type === "bitfield") {
      assert.equal(bitfield.bitfield.length, 106); // 842 bits arrondis à l'octet
      assert.equal(bitfield.bitfield[0], 0xff);
      assert.equal(bitfield.bitfield[105], 0xc0); // 2 dernières pièces + 6 bits de remplissage
    }
    assert.deepEqual(unchoke1, { type: "unchoke" });
    assert.deepEqual(unchoke2, { type: "unchoke" });
  });

  it("lit les messages sans payload", () => {
    assert.deepEqual(parseMessage(hex("")), { type: "keep-alive" });
    assert.deepEqual(parseMessage(hex("00")), { type: "choke" });
    assert.deepEqual(parseMessage(hex("01")), { type: "unchoke" });
    assert.deepEqual(parseMessage(hex("02")), { type: "interested" });
    assert.deepEqual(parseMessage(hex("03")), { type: "not-interested" });
  });

  it("lit l'index d'un have", () => {
    assert.deepEqual(parseMessage(hex("04 0000000c")), { type: "have", index: 12 });
    assert.deepEqual(parseMessage(hex("04 00000349")), { type: "have", index: 841 });
  });

  it("lit index, begin et les données d'un piece", () => {
    assert.deepEqual(parseMessage(hex("07 00000003 00004000 1a45dfa3")), {
      type: "piece",
      index: 3,
      begin: 16384,
      block: hex("1a45dfa3"),
    });
  });

  it("accepte un piece sans données (9 octets pile)", () => {
    const message = parseMessage(hex("07 00000000 00000000"));
    assert.equal(message.type === "piece" && message.block.length, 0);
  });

  it("classe les ids inconnus en 'unknown' sans planter (request, extensions)", () => {
    assert.deepEqual(parseMessage(hex("06 00000000 00000000 00004000")), { type: "unknown", id: 6 });
    assert.deepEqual(parseMessage(hex("14 00")), { type: "unknown", id: 20 });
  });
});

describe("messages / les erreurs", () => {
  it("rejette un have qui ne fait pas 5 octets", () => {
    assert.throws(() => parseMessage(hex("04 0000")), /peer: 'have' message must be 5 bytes/);
    assert.throws(() => parseMessage(hex("04 0000000c 00")), /peer: 'have' message must be 5 bytes/);
  });

  it("rejette un piece de moins de 9 octets", () => {
    assert.throws(() => parseMessage(hex("07 00000003 0000")), /peer: 'piece' message too short/);
  });
});

describe("messages / ce qu'on envoie", () => {
  it("buildInterested : longueur 1, id 2", () => {
    assert.deepEqual(buildInterested(), hex("00000001 02"));
  });

  it("buildRequest : longueur 13, id 6, puis index, begin, length", () => {
    assert.deepEqual(buildRequest(0, 0, 16384), hex("0000000d 06 00000000 00000000 00004000"));
  });

  it("buildRequest : dernier bloc de la dernière pièce de Big Buck Bunny", () => {
    // pièce 841, à l'octet 507904 (31 × 16384) de la pièce
    assert.deepEqual(buildRequest(841, 507904, 16384), hex("0000000d 06 00000349 0007c000 00004000"));
  });

  it("ce qu'on fabrique se redécoupe avec splitMessages", () => {
    const stream = Buffer.concat([buildInterested(), buildRequest(3, 16384, 16384)]);
    const { messages, rest } = splitMessages(stream);
    assert.deepEqual(messages.map(parseMessage), [
      { type: "interested" },
      { type: "unknown", id: 6 },
    ]);
    assert.equal(rest.length, 0);
  });
});
