// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/storage/writePiece.test.ts
//
// Chaque test écrit dans un dossier temporaire neuf, supprimé après le test.
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseTorrent } from "../torrent/parser.ts";
import type { Torrent } from "../torrent/types.ts";
import { writePiece } from "./writePiece.ts";

// hello.torrent : un seul fichier "hello.txt" de 18 octets, pièces de 16 → 16 + 2
const HELLO: Torrent = parseTorrent(readFileSync(new URL("../__fixtures__/hello.torrent", import.meta.url)));
const HELLO_DATA: Buffer = readFileSync(new URL("../__fixtures__/hello.txt", import.meta.url));

// Un torrent à plusieurs fichiers, pièces de 16, 36 octets au total :
//
//   octets    0 ........ 10 ................... 30 ...... 36
//   fichiers  | a.txt (10) | sub/b.txt (20)      | c.txt (6) |
//   pièces    | pièce 0 (16)     | pièce 1 (16)      | p2 (4) |
//             0                  16                  32       36
//
//   pièce 0 = a.txt entier + début de b.txt
//   pièce 1 = fin de b.txt + début de c.txt
//   pièce 2 = fin de c.txt
const MULTI_DATA: Buffer = Buffer.from("AAAAAAAAAA" + "bbbbbbbbbbbbbbbbbbbb" + "CCCCCC");
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

const piece = (torrent: Torrent, data: Buffer, index: number): Buffer =>
  data.subarray(index * torrent.pieceLength, (index + 1) * torrent.pieceLength);

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "bt-storage-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("writePiece / un seul fichier", () => {
  it("pièces 0 puis 1 : le fichier contient \"Hello BitTorrent!\\n\"", async () => {
    await writePiece(dir, HELLO, 0, piece(HELLO, HELLO_DATA, 0));
    await writePiece(dir, HELLO, 1, piece(HELLO, HELLO_DATA, 1));
    assert.deepEqual(await readFile(join(dir, HELLO.files[0].path)), HELLO_DATA);
  });

  it("pièces dans le désordre (1 puis 0) : même résultat", async () => {
    await writePiece(dir, HELLO, 1, piece(HELLO, HELLO_DATA, 1));
    await writePiece(dir, HELLO, 0, piece(HELLO, HELLO_DATA, 0));
    assert.deepEqual(await readFile(join(dir, HELLO.files[0].path)), HELLO_DATA);
  });

  it("seulement la pièce 1 : écrite à la position 16, pas au début", async () => {
    await writePiece(dir, HELLO, 1, piece(HELLO, HELLO_DATA, 1));
    const content = await readFile(join(dir, HELLO.files[0].path));
    assert.equal(content.length, 18);
    assert.deepEqual(content.subarray(16), Buffer.from("!\n"));
  });

  it("réécrire la pièce 0 ne vide pas le reste du fichier", async () => {
    await writePiece(dir, HELLO, 0, piece(HELLO, HELLO_DATA, 0));
    await writePiece(dir, HELLO, 1, piece(HELLO, HELLO_DATA, 1));
    await writePiece(dir, HELLO, 0, piece(HELLO, HELLO_DATA, 0));
    assert.deepEqual(await readFile(join(dir, HELLO.files[0].path)), HELLO_DATA);
  });
});

describe("writePiece / plusieurs fichiers", () => {
  it("pièce 0 à cheval sur a.txt et b.txt : coupée au bon endroit", async () => {
    await writePiece(dir, MULTI, 0, piece(MULTI, MULTI_DATA, 0));
    assert.deepEqual(await readFile(join(dir, "multi/a.txt")), Buffer.from("AAAAAAAAAA"));
    assert.deepEqual(await readFile(join(dir, "multi/sub/b.txt")), Buffer.from("bbbbbb"));
  });

  it("crée les sous-dossiers (multi/sub/)", async () => {
    await writePiece(dir, MULTI, 0, piece(MULTI, MULTI_DATA, 0));
    assert.equal((await stat(join(dir, "multi/sub"))).isDirectory(), true);
  });

  it("toutes les pièces : chaque fichier a exactement son contenu", async () => {
    for (const index of [2, 0, 1]) await writePiece(dir, MULTI, index, piece(MULTI, MULTI_DATA, index));
    assert.deepEqual(await readFile(join(dir, "multi/a.txt")), Buffer.from("AAAAAAAAAA"));
    assert.deepEqual(await readFile(join(dir, "multi/sub/b.txt")), Buffer.from("bbbbbbbbbbbbbbbbbbbb"));
    assert.deepEqual(await readFile(join(dir, "multi/c.txt")), Buffer.from("CCCCCC"));
  });

  it("pièce 2 (dans c.txt seulement) : ne crée pas a.txt ni b.txt", async () => {
    await writePiece(dir, MULTI, 2, piece(MULTI, MULTI_DATA, 2));
    assert.deepEqual(await readFile(join(dir, "multi/c.txt")), Buffer.from("\0\0CCCC"));
    assert.equal(existsSync(join(dir, "multi/a.txt")), false);
    assert.equal(existsSync(join(dir, "multi/sub/b.txt")), false);
  });
});

describe("writePiece / les erreurs", () => {
  it("données de la mauvaise taille : rejette sans rien écrire", async () => {
    await assert.rejects(writePiece(dir, HELLO, 0, Buffer.from("trop court")), /piece 0 has wrong size/);
    assert.equal(existsSync(join(dir, HELLO.files[0].path)), false);
  });

  it("index hors du torrent : rejette", async () => {
    await assert.rejects(writePiece(dir, HELLO, 2, Buffer.alloc(16)), /piece 2 does not exist/);
    await assert.rejects(writePiece(dir, HELLO, -1, Buffer.alloc(16)), /piece -1 does not exist/);
  });
});
