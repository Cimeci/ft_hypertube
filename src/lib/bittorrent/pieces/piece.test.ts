// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTorrent } from "../torrent/parser.ts";
import type { Torrent } from "../torrent/types.ts";
import { pieceBlocks, pieceSize, piecesForFile, verifyPiece } from "./piece.ts";

const fixture = (name: string) =>
  parseTorrent(readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url)));

// hello.txt : 18 octets, pièces de 16 → 16 + 2
const HELLO = fixture("hello.torrent");
// Big Buck Bunny : 441 396 841 octets, 842 pièces de 524 288
const BUNNY = fixture("big-buck-bunny.torrent");
// Le contenu réel de hello.torrent : "Hello BitTorrent!\n"
const HELLO_DATA = readFileSync(new URL("../__fixtures__/hello.txt", import.meta.url));

describe("piece / pieceSize", () => {
  it("hello : pièce 0 pleine (16), pièce 1 = les 2 octets restants", () => {
    assert.equal(pieceSize(HELLO, 0), 16);
    assert.equal(pieceSize(HELLO, 1), 2);
  });

  it("Big Buck Bunny : toutes les pièces font 524 288, sauf la dernière", () => {
    assert.equal(pieceSize(BUNNY, 0), 524288);
    assert.equal(pieceSize(BUNNY, 840), 524288);
    assert.equal(pieceSize(BUNNY, 841), 470633);
  });

  it("la somme des tailles de toutes les pièces = totalLength", () => {
    for (const torrent of [HELLO, BUNNY]) {
      let sum = 0;
      for (let index = 0; index < torrent.pieces.length; index++) sum += pieceSize(torrent, index);
      assert.equal(sum, torrent.totalLength);
    }
  });

  it("fichier qui tombe pile sur un multiple : la dernière pièce est pleine", () => {
    const exact = { ...HELLO, totalLength: 32 };
    assert.equal(pieceSize(exact, 1), 16);
  });
});

describe("piece / pieceBlocks", () => {
  it("pièce pleine de Big Buck Bunny : 32 blocs de 16 384, collés bout à bout", () => {
    const blocks = pieceBlocks(BUNNY, 0);
    assert.equal(blocks.length, 32);
    blocks.forEach((block, i) => assert.deepEqual(block, { begin: i * 16384, length: 16384 }));
  });

  it("dernière pièce (470 633 octets) : 28 blocs pleins + 1 bloc de 11 881", () => {
    const blocks = pieceBlocks(BUNNY, 841);
    assert.equal(blocks.length, 29);
    assert.deepEqual(blocks[27], { begin: 442368, length: 16384 });
    assert.deepEqual(blocks.at(-1), { begin: 458752, length: 11881 });
  });

  it("les blocs couvrent toute la pièce, sans trou ni chevauchement", () => {
    for (const index of [0, 840, 841]) {
      let expectedBegin = 0;
      for (const block of pieceBlocks(BUNNY, index)) {
        assert.equal(block.begin, expectedBegin);
        expectedBegin += block.length;
      }
      assert.equal(expectedBegin, pieceSize(BUNNY, index));
    }
  });

  it("pièce plus petite qu'un bloc (hello) : un seul bloc de la taille de la pièce", () => {
    assert.deepEqual(pieceBlocks(HELLO, 0), [{ begin: 0, length: 16 }]);
    assert.deepEqual(pieceBlocks(HELLO, 1), [{ begin: 0, length: 2 }]);
  });
});

describe("piece / verifyPiece", () => {
  it("accepte les vraies pièces de hello.txt", () => {
    assert.equal(verifyPiece(HELLO, 0, Buffer.from("Hello BitTorrent")), true);
    assert.equal(verifyPiece(HELLO, 1, Buffer.from("!\n")), true);
  });

  it("accepte des blocs recollés avec Buffer.concat", () => {
    const blocks = [HELLO_DATA.subarray(0, 5), HELLO_DATA.subarray(5, 16)];
    assert.equal(verifyPiece(HELLO, 0, Buffer.concat(blocks)), true);
  });

  it("rejette une pièce avec un seul octet modifié", () => {
    assert.equal(verifyPiece(HELLO, 0, Buffer.from("Hello BitTorrenT")), false);
  });

  it("rejette une pièce tronquée ou trop longue", () => {
    assert.equal(verifyPiece(HELLO, 0, HELLO_DATA.subarray(0, 15)), false);
    assert.equal(verifyPiece(HELLO, 0, HELLO_DATA), false);
  });

  it("rejette les bonnes données sous le mauvais numéro de pièce", () => {
    assert.equal(verifyPiece(HELLO, 1, Buffer.from("Hello BitTorrent")), false);
  });
});

// Le torrent à plusieurs fichiers de writePiece.test.ts, pièces de 16 :
//
//   octets    0 ........ 10 ................... 30 ...... 36
//   fichiers  | a.txt (10) | sub/b.txt (20)      | c.txt (6) |
//   pièces    | pièce 0 (16)     | pièce 1 (16)      | p2 (4) |
const MULTI: Torrent = {
  trackers: [],
  name: "multi",
  pieceLength: 16,
  pieces: [Buffer.alloc(20), Buffer.alloc(20), Buffer.alloc(20)],
  files: [
    { path: "multi/a.txt", length: 10, offset: 0 },
    { path: "multi/sub/b.txt", length: 20, offset: 10 },
    { path: "multi/c.txt", length: 6, offset: 30 },
  ],
  totalLength: 36,
  infoHash: Buffer.alloc(20),
};

describe("piece / piecesForFile", () => {
  it("hello (un seul fichier) : toutes les pièces", () => {
    assert.deepEqual(piecesForFile(HELLO, 0), [0, 1]);
  });

  it("a.txt, entièrement dans la pièce 0 : [0]", () => {
    assert.deepEqual(piecesForFile(MULTI, 0), [0]);
  });

  it("b.txt, à cheval sur les pièces 0 et 1 : [0, 1]", () => {
    assert.deepEqual(piecesForFile(MULTI, 1), [0, 1]);
  });

  it("c.txt, le dernier fichier, finit avec la dernière pièce : [1, 2]", () => {
    assert.deepEqual(piecesForFile(MULTI, 2), [1, 2]);
  });

  it("un fichier qui finit pile à la fin d'une pièce ne déborde pas sur la suivante", () => {
    const exact: Torrent = { ...MULTI, files: [{ path: "x", length: 16, offset: 0 }, { path: "y", length: 20, offset: 16 }] };
    assert.deepEqual(piecesForFile(exact, 0), [0]);
    assert.deepEqual(piecesForFile(exact, 1), [1, 2]);
  });

  it("un fichier vide : aucune pièce", () => {
    const withEmpty: Torrent = { ...MULTI, files: [{ path: "empty", length: 0, offset: 0 }, ...MULTI.files] };
    assert.deepEqual(piecesForFile(withEmpty, 0), []);
  });

  it("Big Buck Bunny, le .mp4 : les pièces 634 à 752 (119 pièces, ~62 Mo au lieu de 441)", () => {
    const mp4 = BUNNY.files.findIndex((file) => file.path.endsWith(".mp4"));
    const pieces = piecesForFile(BUNNY, mp4);
    assert.equal(pieces.length, 119);
    assert.equal(pieces[0], 634);
    assert.equal(pieces[pieces.length - 1], 752);
  });

  it("les pièces sont dans l'ordre et sans trou", () => {
    const pieces = piecesForFile(BUNNY, BUNNY.files.findIndex((file) => file.path.endsWith(".avi")));
    pieces.forEach((index, i) => assert.equal(index, pieces[0] + i));
  });

  it("index de fichier hors du torrent : rejette", () => {
    assert.throws(() => piecesForFile(MULTI, 3), /file 3 does not exist/);
    assert.throws(() => piecesForFile(MULTI, -1), /file -1 does not exist/);
  });
});
