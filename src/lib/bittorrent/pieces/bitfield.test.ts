// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { splitMessages } from "../peer/messages.ts";
import { hasPiece, setPiece } from "./bitfield.ts";

// Le vrai bitfield de Big Buck Bunny (842 pièces, 106 octets) : le peer a tout
const REAL_MESSAGES = readFileSync(new URL("../__fixtures__/peer-messages.bin", import.meta.url));
const REAL_BITFIELD = splitMessages(REAL_MESSAGES).messages[0].subarray(1);
const PIECE_COUNT = 842;

const hex = (value: string) => Buffer.from(value.replaceAll(" ", ""), "hex");

describe("bitfield / hasPiece", () => {
  it("le vrai peer a les 842 pièces", () => {
    for (let index = 0; index < PIECE_COUNT; index++) {
      assert.equal(hasPiece(REAL_BITFIELD, index), true, `pièce ${index}`);
    }
  });

  it("dernier octet c0 : pièces 840 et 841 présentes, 842 à 847 = remplissage", () => {
    assert.equal(hasPiece(REAL_BITFIELD, 840), true);
    assert.equal(hasPiece(REAL_BITFIELD, 841), true);
    for (let index = 842; index < 848; index++) {
      assert.equal(hasPiece(REAL_BITFIELD, index), false, `pièce ${index}`);
    }
  });

  it("a0 : la pièce 0 est le bit de gauche (pièces 0 et 2 présentes)", () => {
    const bitfield = hex("a0");
    assert.deepEqual(
      [0, 1, 2, 3, 4, 5, 6, 7].map((index) => hasPiece(bitfield, index)),
      [true, false, true, false, false, false, false, false],
    );
  });

  it("01 : la pièce 7 est le bit de droite", () => {
    const bitfield = hex("01");
    assert.equal(hasPiece(bitfield, 7), true);
    assert.equal(hasPiece(bitfield, 0), false);
  });

  it("lit le bon octet : 00 80 → seule la pièce 8 est présente", () => {
    const bitfield = hex("00 80");
    assert.equal(hasPiece(bitfield, 8), true);
    for (const index of [0, 7, 9, 15]) {
      assert.equal(hasPiece(bitfield, index), false, `pièce ${index}`);
    }
  });

  it("répond false au-delà du bitfield, sans planter", () => {
    assert.equal(hasPiece(REAL_BITFIELD, 848), false); // octet 106 : n'existe pas
    assert.equal(hasPiece(REAL_BITFIELD, 100_000), false);
    assert.equal(hasPiece(Buffer.alloc(0), 0), false);
  });
});

describe("bitfield / setPiece", () => {
  it("have 12 sur une boîte vide de 2 octets : 00 08", () => {
    const bitfield = Buffer.alloc(2);
    setPiece(bitfield, 12);
    assert.deepEqual(bitfield, hex("00 08"));
    assert.equal(hasPiece(bitfield, 12), true);
  });

  it("have 1 marque la pièce 1, pas la pièce 9", () => {
    const bitfield = Buffer.alloc(2);
    setPiece(bitfield, 1);
    assert.deepEqual(bitfield, hex("40 00"));
    assert.equal(hasPiece(bitfield, 9), false);
  });

  it("garde les pièces déjà présentes (80 → 88 avec la pièce 4)", () => {
    const bitfield = hex("80");
    setPiece(bitfield, 4);
    assert.deepEqual(bitfield, hex("88"));
  });

  it("poser deux fois la même pièce ne change rien", () => {
    const bitfield = hex("a0");
    setPiece(bitfield, 2);
    assert.deepEqual(bitfield, hex("a0"));
  });

  it("pièces 0 et 7 : bit de gauche et bit de droite", () => {
    const bitfield = Buffer.alloc(1);
    setPiece(bitfield, 0);
    setPiece(bitfield, 7);
    assert.deepEqual(bitfield, hex("81"));
  });

  it("refait le dernier octet du vrai bitfield (c0) à partir de have 840 et 841", () => {
    const bitfield = Buffer.alloc(106);
    setPiece(bitfield, 840);
    setPiece(bitfield, 841);
    assert.equal(bitfield[105], 0xc0);
  });

  it("ignore un have hors du bitfield, sans planter ni rien modifier", () => {
    const bitfield = Buffer.alloc(2);
    setPiece(bitfield, 16);
    setPiece(bitfield, 900);
    assert.deepEqual(bitfield, hex("00 00"));
  });
});
